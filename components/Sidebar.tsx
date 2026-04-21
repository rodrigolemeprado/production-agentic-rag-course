import { Database, FolderOpen, UploadCloud, Settings, Hash } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-gray-50/50 dark:bg-zinc-950/50 border-r border-gray-200 dark:border-zinc-800 flex flex-col hidden md:flex">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold flex items-center gap-2.5 text-gray-900 dark:text-white">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Database size={18} className="text-white" />
          </div>
          Corporate RAG
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <div>
          <h2 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-2">Knowledge Base</h2>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold transition-colors">
                <FolderOpen size={16} />
                Documentos Ativos
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
                <UploadCloud size={16} />
                Upload Manual
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-2">Recentes</h2>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
                <Hash size={14} className="opacity-50" />
                Políticas de RH 2026
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
                <Hash size={14} className="opacity-50" />
                Relatório de Vendas
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <button className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl font-medium text-gray-700 dark:text-gray-300 w-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
          <Settings size={18} className="text-gray-400" />
          Settings
        </button>
      </div>
    </aside>
  );
}
