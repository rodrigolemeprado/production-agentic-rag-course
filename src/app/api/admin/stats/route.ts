import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://rag_user:rag_password@rag_db:5432/rag_db",
});

async function isAdmin(userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT u.role, d.name as dept_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1`,
    [userId]
  );
  const user = rows[0];
  return user?.role === "admin" || user?.dept_name === "Administração";
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // Agregações de tokens por período
  const { rows: tokenRows } = await pool.query(`
    SELECT
      u.name AS user_name,
      u.email,
      SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '1 day'  THEN t.input_tokens + t.output_tokens ELSE 0 END) AS today,
      SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '7 days' THEN t.input_tokens + t.output_tokens ELSE 0 END) AS last_7d,
      SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '15 days' THEN t.input_tokens + t.output_tokens ELSE 0 END) AS last_15d,
      SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '30 days' THEN t.input_tokens + t.output_tokens ELSE 0 END) AS last_30d,
      SUM(t.input_tokens + t.output_tokens) AS total
    FROM users u
    LEFT JOIN token_usage t ON t.user_id = u.id
    GROUP BY u.id, u.name, u.email
    ORDER BY total DESC NULLS LAST
  `);

  // Últimos 20 uploads com dados do usuário
  const { rows: uploadRows } = await pool.query(`
    SELECT
      d.id,
      d.filename,
      d.status,
      d.created_at,
      u.name AS uploader_name,
      u.email AS uploader_email,
      dep.name AS department_name
    FROM documents d
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN departments dep ON dep.id = u.department_id
    ORDER BY d.created_at DESC
    LIMIT 20
  `);

  // Totais globais
  const { rows: totalsRow } = await pool.query(`
    SELECT
      COUNT(DISTINCT u.id) AS total_users,
      COUNT(DISTINCT d.id) AS total_documents,
      COALESCE(SUM(t.input_tokens + t.output_tokens), 0) AS total_tokens
    FROM users u
    FULL OUTER JOIN documents d ON true
    FULL OUTER JOIN token_usage t ON true
  `);

  return NextResponse.json({
    tokenUsage: tokenRows,
    recentUploads: uploadRows,
    totals: totalsRow[0],
  });
}
