import { google } from '@ai-sdk/google';
import { streamText, embed } from 'ai';
import { Pool } from 'pg';

// Configura o pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://rag_user:rag_password@localhost:5432/rag_db'
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. Gera o embedding da query do usuário usando Gemini
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: lastMessage,
    });

    // 2. Consulta ao PostgreSQL pgvector pelos chunks mais relevantes
    // Formato de vetor para pgvector: '[0.1, 0.2, ...]'
    const embeddingStr = `[${embedding.join(',')}]`;
    
    // Busca Híbrida Vectorial usando Cosine Distance (<=>) limitando ao Top 5
    const { rows } = await pool.query(
      `SELECT content, 1 - (embedding <=> $1) as similarity 
       FROM document_chunks 
       ORDER BY embedding <=> $1 
       LIMIT 5`,
      [embeddingStr]
    );

    const contextTexts = rows.map((row) => row.content).join('\n\n---\n\n');

    // 3. Injeção no System Prompt
    const systemPrompt = `Você é um assistente corporativo especializado em responder dúvidas com base estritamente na base de conhecimento da empresa.
    
CONTEXTO CORPORATIVO (RAG):
${contextTexts}

INSTRUÇÕES:
- Responda APENAS E ESTRITAMENTE com base no contexto acima.
- Se a resposta para a pergunta não estiver no contexto, responda exatamente: "Desculpe, não possuo informações sobre isso na base de conhecimento atual."
- Sob NENHUMA hipótese você deve inventar ou presumir dados (Zero Alucinação).
- Forneça respostas claras e profissionais, organizadas usando formatação Markdown.`;

    // 4. Chamada de Geração e Streaming com Gemini 1.5 Flash
    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Erro na Rota Chat RAG:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no RAG' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
