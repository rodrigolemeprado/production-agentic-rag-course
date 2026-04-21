"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Upload,
  Users,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { UploadModal } from "./UploadModal";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { data: session } = useSession();
  const [showUpload, setShowUpload] = useState(false);
  const pathname = usePathname();
  const isAdmin =
    (session?.user as any)?.role === "admin" ||
    (session?.user as any)?.departmentName === "Administração";

  const navItems = [
    { href: "/", label: "Chat RAG", icon: BookOpen },
    ...(isAdmin
      ? [{ href: "/admin", label: "Painel Admin", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <>
      <aside className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">
                RAG Corporativo
              </p>
              <p className="text-zinc-500 text-xs">Base de Conhecimento</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}

          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Upload size={16} />
            Novo Upload
          </button>
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-zinc-800">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {session.user.name}
                </p>
                <p className="text-zinc-500 text-xs truncate">
                  {(session.user as any).role === "admin" ? "Administrador" : "Usuário"}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
