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
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = session.user as {
      id: string;
      role: string;
      departmentId: number;
      email: string;
    };
    const isAdmin = user.role === "admin";

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. Gera embedding da query via Gemini text-embedding-004
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: lastMessage,
    });
    const embeddingStr = `[${embedding.join(",")}]`;

    // 2. Busca vetorial filtrada por departamento (JSONB @> com índice GIN)
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
      : [embeddingStr, JSON.stringify([user.departmentId])];

    const { rows } = await pool.query(queryText, queryParams);

    const hasDocuments = rows.length > 0;
    const contextTexts = hasDocuments
      ? rows.map((r) => r.content).join("\n\n---\n\n")
      : "SISTEMA VAZIO: Nenhum documento processado e indexado para este departamento.";

    // 3. System Prompt com contexto RAG adaptativo
    const systemPrompt = `Você é um assistente corporativo que responde SOMENTE com base nos documentos da empresa.

Usuário: ${user.email} | Perfil: ${user.role}

CONTEXTO CORPORATIVO (RAG):
${contextTexts}

REGRAS:
${hasDocuments ? `
- Responda APENAS com base no contexto acima.
- Se não encontrar a resposta no contexto, diga exatamente: "Desculpe, não possuo informações sobre isso na base de conhecimento atual."
- Zero Alucinação. Use Markdown quando útil.
` : `
- Informe o usuário que a base de conhecimento atual está VAZIA e sem documentações para o setor dele.
- Explique brevemente que para você poder ajudá-lo, o Administrador (ou ele mesmo, se tiver acesso) precisa acessar o "Painel Admin" (ou aba de Uploads), enviar novos PDFs e aguardar o processamento e indexação.
- NÃO tente responder à pergunta original dele e NÃO invente respostas. Apenas direcione para o upload de documentos.
`}`;

    // 4. Streaming Gemini 1.5 Flash com captura de tokens via onFinish
    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages,
      onFinish: async ({ usage }) => {
        if (!user.id || !usage) return;
        try {
          await pool.query(
            `INSERT INTO token_usage (user_id, input_tokens, output_tokens)
             VALUES ($1, $2, $3)`,
            [user.id, usage.promptTokens ?? 0, usage.completionTokens ?? 0]
          );
        } catch (err) {
          console.error("[Chat] Falha ao registrar token_usage:", err);
        }
      },
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
