import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, rename, mkdir } from "fs/promises";
import { join } from "path";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://rag_user:rag_password@rag_db:5432/rag_db",
});

const STAGING_DIR = process.env.STAGING_DIR ?? "/app/data/staging";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string };

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawIds = formData.getAll("department_ids");
  const departmentIds = rawIds.map((id) => Number(id)).filter(Boolean);

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Arquivo inválido. Envie um PDF." },
      { status: 400 }
    );
  }

  if (departmentIds.length === 0) {
    return NextResponse.json(
      { error: "Selecione ao menos um departamento." },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseName = safeName.replace(/\.pdf$/i, "");
  const tmpPath = join(STAGING_DIR, `${baseName}.tmp`);
  const pdfPath = join(STAGING_DIR, `${baseName}.pdf`);
  const metaPath = join(STAGING_DIR, `${baseName}.meta.json`);

  try {
    await mkdir(STAGING_DIR, { recursive: true });

    // 1. Registra documento no banco (status: pending)
    const { rows } = await pool.query(
      `INSERT INTO documents (filename, user_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [safeName, user.id]
    );
    const documentId: string = rows[0].id;

    // 2. Escreve PDF como .tmp (write atômico)
    const bytes = await file.arrayBuffer();
    await writeFile(tmpPath, Buffer.from(bytes));

    // 3. Escreve .meta.json com permissões e document_id
    const meta = {
      document_id: documentId,
      original_name: file.name,
      uploaded_by: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      allowed_departments: departmentIds,
      uploaded_at: new Date().toISOString(),
    };
    await writeFile(metaPath, JSON.stringify(meta, null, 2));

    // 4. Rename atômico .tmp → .pdf (sinaliza ao worker que está pronto)
    await rename(tmpPath, pdfPath);

    return NextResponse.json({
      success: true,
      documentId,
      message: `Arquivo "${safeName}" enviado para processamento.`,
    });
  } catch (err) {
    console.error("[Upload] Erro:", err);
    return NextResponse.json(
      { error: "Falha no upload. Tente novamente." },
      { status: 500 }
    );
  }
}
