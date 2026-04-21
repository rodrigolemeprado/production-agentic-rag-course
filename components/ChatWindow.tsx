import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-40">
      <div className="max-w-3xl mx-auto flex flex-col gap-8 pt-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-400 dark:text-zinc-600">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-6">
              <Bot size={32} className="text-blue-600 dark:text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-zinc-300 mb-2">Knowledge Base Inteligente</h2>
            <p className="max-w-sm">
              Consulte contratos, normas ou artigos. Minhas respostas são estritamente geradas a partir do nosso banco vetorial.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div 
                className={`px-5 py-4 rounded-2xl max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                    : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm rounded-tl-sm text-gray-800 dark:text-gray-200'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-950 prose-pre:border dark:prose-pre:border-zinc-800 max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={18} className="text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 justify-start"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="px-5 py-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm rounded-tl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
