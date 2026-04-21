import { google } from "@ai-sdk/google";
import { streamText, embed } from "ai";
import { Pool } from "pg";
import { auth } from "@/auth";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://rag_user:rag_password@rag_db:5432/rag_db",
});

export async function POST(req: Request) {
  try {
    // 1. Autenticação - obtém sessão do usuário logado
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = session.user as {
      role: string;
      departmentId: number;
      email: string;
    };
    const isAdmin = user.role === "admin";
    const departmentId = user.departmentId;

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 2. Gera embedding da query usando Gemini text-embedding-004
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: lastMessage,
    });
    const embeddingStr = `[${embedding.join(",")}]`;

    // 3. Busca vetorial com filtro JSONB por departamento (índice GIN)
    //    Admins: acesso total (sem filtro)
    //    Usuários: operador @> filtra apenas chunks onde allowed_departments contém o dept do usuário
    const queryText = isAdmin
      ? `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
         FROM document_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT 5`
      : `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
         FROM document_chunks
         WHERE metadata->'allowed_departments' @> $2::jsonb
         ORDER BY embedding <=> $1::vector
         LIMIT 5`;

    const queryParams = isAdmin
      ? [embeddingStr]
      : [embeddingStr, JSON.stringify([departmentId])];

    const { rows } = await pool.query(queryText, queryParams);

    const contextTexts =
      rows.length > 0
        ? rows.map((row) => row.content).join("\n\n---\n\n")
        : "Nenhum documento relevante encontrado na base de conhecimento para este departamento.";

    // 4. System Prompt com contexto RAG
    const systemPrompt = `Você é um assistente corporativo especializado em responder dúvidas com base estritamente na base de conhecimento da empresa.

Usuário autenticado: ${user.email} | Perfil: ${user.role}

CONTEXTO CORPORATIVO (RAG):
${contextTexts}

INSTRUÇÕES:
- Responda APENAS E ESTRITAMENTE com base no contexto acima.
- Se a resposta não estiver no contexto, diga exatamente: "Desculpe, não possuo informações sobre isso na base de conhecimento atual."
- Sob NENHUMA hipótese invente ou presuma dados (Zero Alucinação).
- Respostas claras, profissionais, usando Markdown quando útil.`;

    // 5. Streaming via Gemini 1.5 Flash
    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Chat RAG] Erro:", error);
    return new Response(JSON.stringify({ error: "Erro interno no RAG" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
