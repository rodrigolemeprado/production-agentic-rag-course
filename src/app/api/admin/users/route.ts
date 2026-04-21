import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://rag_user:rag_password@rag_db:5432/rag_db",
});

async function isAdmin(userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT u.role, d.name AS dept_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1`,
    [userId]
  );
  const user = rows[0];
  return user?.role === "admin" || user?.dept_name === "Administração";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const actorId = (session?.user as any)?.id;

  if (!session?.user || !actorId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await isAdmin(actorId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, department_id, role = "user" } = body;

  if (!name || !email || !password || !department_id) {
    return NextResponse.json(
      { error: "Campos obrigatórios: name, email, password, department_id." },
      { status: 400 }
    );
  }

  if (!["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Role inválida." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role, department_id]
    );
    return NextResponse.json({ success: true, user: rows[0] }, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "E-mail já cadastrado." },
        { status: 409 }
      );
    }
    console.error("[Admin/Users] Erro:", err);
    return NextResponse.json(
      { error: "Falha ao criar usuário." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  const actorId = (session?.user as any)?.id;

  if (!session?.user || !actorId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await isAdmin(actorId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { rows } = await pool.query(`
    SELECT u.id, u.name, u.email, u.role, u.created_at, d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    ORDER BY u.created_at DESC
  `);

  return NextResponse.json({ users: rows });
}
