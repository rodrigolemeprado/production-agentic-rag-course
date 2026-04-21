"use client";

import { useState, useRef, FormEvent } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

const DEPARTMENTS = [
  { id: 1, label: "Administração" },
  { id: 2, label: "RH" },
  { id: 3, label: "TI" },
  { id: 4, label: "Financeiro" },
  { id: 5, label: "Jurídico" },
  { id: 6, label: "Comercial" },
  { id: 7, label: "Marketing" },
  { id: 8, label: "Operações" },
];

type Status = "idle" | "loading" | "success" | "error";

export function UploadModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function toggleDept(id: number) {
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || selectedDepts.length === 0) return;

    setStatus("loading");
    const fd = new FormData();
    fd.append("file", file);
    selectedDepts.forEach((id) => fd.append("department_ids", String(id)));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro desconhecido.");
      setStatus("success");
      setMessage(json.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Upload size={20} className="text-blue-400" />
          Enviar Documento
        </h2>
        <p className="text-zinc-500 text-sm mb-6">
          Selecione o PDF e os setores com permissão de acesso.
        </p>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle size={40} className="text-green-400" />
            <p className="text-white font-medium">{message}</p>
            <button
              onClick={onClose}
              className="mt-2 text-sm text-zinc-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File picker */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-xl p-6 cursor-pointer flex flex-col items-center gap-2 transition-colors"
            >
              <FileText size={32} className="text-zinc-500" />
              {file ? (
                <p className="text-white text-sm font-medium truncate max-w-xs">
                  {file.name}
                </p>
              ) : (
                <p className="text-zinc-500 text-sm">
                  Clique ou arraste o PDF aqui
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Departamentos */}
            <div>
              <p className="text-sm font-medium text-zinc-400 mb-2">
                Setores com acesso permitido
              </p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDept(d.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedDepts.includes(d.id)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                <AlertCircle size={16} />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || selectedDepts.length === 0 || status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar para Processamento"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
