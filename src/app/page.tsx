"use client";

import { useChat } from "@ai-sdk/react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { Send } from "lucide-react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
        />
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-gray-50 dark:from-zinc-950 to-transparent pt-12">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSubmit} 
              className="relative flex items-center shadow-xl rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all"
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Pergunte sobre a documentação corporativa..."
                className="w-full py-4 pl-4 pr-14 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !(input ?? "").trim()}
                className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 text-white dark:disabled:text-zinc-600 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-xs text-center text-gray-400 dark:text-zinc-600 mt-3 font-medium">
              Assistente RAG baseado em Google Gemini. Zero alucinação focada na base.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
