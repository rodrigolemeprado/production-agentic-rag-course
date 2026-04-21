import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, rename, mkdir } from "fs/promises";
import { join } from "path";

const STAGING_DIR = process.env.STAGING_DIR ?? "/app/data/staging";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

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

    // 1. Escreve PDF como .tmp (write atômico)
    const bytes = await file.arrayBuffer();
    await writeFile(tmpPath, Buffer.from(bytes));

    // 2. Escreve .meta.json com permissões de acesso
    const meta = {
      original_name: file.name,
      uploaded_by: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
      },
      allowed_departments: departmentIds,
      uploaded_at: new Date().toISOString(),
    };
    await writeFile(metaPath, JSON.stringify(meta, null, 2));

    // 3. Renomeia .tmp → .pdf (rename atômico - sinaliza ao worker que está pronto)
    await rename(tmpPath, pdfPath);

    return NextResponse.json({
      success: true,
      message: `Arquivo "${safeName}" enviado para processamento.`,
      filename: safeName,
    });
  } catch (err) {
    console.error("[Upload] Erro:", err);
    return NextResponse.json(
      { error: "Falha no upload. Tente novamente." },
      { status: 500 }
    );
  }
}
