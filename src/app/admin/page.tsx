"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Zap,
  TrendingUp,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type TokenRow = {
  user_name: string;
  email: string;
  today: number;
  last_7d: number;
  last_15d: number;
  last_30d: number;
  total: number;
};

type UploadRow = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  uploader_name: string;
  uploader_email: string;
  department_name: string;
};

type Stats = {
  tokenUsage: TokenRow[];
  recentUploads: UploadRow[];
  totals: { total_users: number; total_documents: number; total_tokens: number };
};

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

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  processed: "bg-green-500/15 text-green-400 border-green-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "last_7d" | "last_15d" | "last_30d" | "total">("last_7d");

  // New user form
  const [form, setForm] = useState({
    name: "", email: "", password: "", department_id: "", role: "user",
  });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("loading");
    setFormMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, department_id: Number(form.department_id) }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFormStatus("error");
      setFormMsg(json.error ?? "Erro ao criar usuário.");
    } else {
      setFormStatus("ok");
      setFormMsg(`Usuário "${json.user.name}" criado com sucesso!`);
      setForm({ name: "", email: "", password: "", department_id: "", role: "user" });
      // refresh stats
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
    }
  }

  const PERIOD_LABELS = {
    today: "Hoje",
    last_7d: "7 dias",
    last_15d: "15 dias",
    last_30d: "30 dias",
    total: "Total",
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Monitoramento de tokens, uploads e gestão de usuários
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Usuários cadastrados", value: stats?.totals?.total_users ?? 0, icon: Users, color: "blue" },
            { label: "Documentos enviados", value: stats?.totals?.total_documents ?? 0, icon: FileText, color: "emerald" },
            { label: "Tokens consumidos", value: Number(stats?.totals?.total_tokens ?? 0).toLocaleString(), icon: Zap, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4`}>
                <Icon size={20} className={`text-${color}-400`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-zinc-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Token Usage Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              <h2 className="text-white font-semibold">Consumo de Tokens por Usuário</h2>
            </div>
            {/* Period Selector */}
            <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
              {(Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                    period === p
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Usuário</th>
                <th className="text-right text-xs text-zinc-500 font-medium px-5 py-3">Tokens ({PERIOD_LABELS[period]})</th>
                <th className="text-right text-xs text-zinc-500 font-medium px-5 py-3">Total Histórico</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.tokenUsage ?? []).map((row) => (
                <tr key={row.email} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white text-sm font-medium">{row.user_name}</p>
                    <p className="text-zinc-500 text-xs">{row.email}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-amber-400 font-mono text-sm font-semibold">
                      {Number(row[period] ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-400 text-sm font-mono">
                    {Number(row.total ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(stats?.tokenUsage ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-zinc-600 py-8 text-sm">
                    Nenhum dado de consumo ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Uploads */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-zinc-800">
            <Clock size={18} className="text-emerald-400" />
            <h2 className="text-white font-semibold">Uploads Recentes</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Arquivo</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Enviado por</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Setor</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Status</th>
                <th className="text-right text-xs text-zinc-500 font-medium px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentUploads ?? []).map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white text-sm font-medium truncate max-w-xs">{row.filename}</p>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-sm">{row.uploader_name ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-400 text-sm">{row.department_name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_BADGE[row.status] ?? ""}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500 text-xs">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {(stats?.recentUploads ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-zinc-600 py-8 text-sm">
                    Nenhum documento enviado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create User Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Plus size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">Adicionar Novo Usuário</h2>
          </div>
          <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
            {[
              { id: "name", label: "Nome completo", placeholder: "João da Silva", type: "text" },
              { id: "email", label: "E-mail corporativo", placeholder: "joao@empresa.com", type: "email" },
              { id: "password", label: "Senha inicial", placeholder: "••••••••", type: "password" },
            ].map(({ id, label, placeholder, type }) => (
              <div key={id}>
                <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
                <input
                  id={`new-user-${id}`}
                  type={type}
                  required
                  placeholder={placeholder}
                  value={(form as any)[id]}
                  onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Departamento</label>
              <select
                id="new-user-department"
                required
                value={form.department_id}
                onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Selecione...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Perfil de Acesso</label>
              <select
                id="new-user-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="col-span-2 flex items-center gap-4">
              <button
                id="create-user-submit"
                type="submit"
                disabled={formStatus === "loading"}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors flex items-center gap-2"
              >
                {formStatus === "loading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Criando...</>
                ) : (
                  <><Plus size={16} /> Criar Usuário</>
                )}
              </button>
              {formStatus === "ok" && (
                <span className="flex items-center gap-1.5 text-green-400 text-sm">
                  <CheckCircle size={16} /> {formMsg}
                </span>
              )}
              {formStatus === "error" && (
                <span className="flex items-center gap-1.5 text-red-400 text-sm">
                  <AlertCircle size={16} /> {formMsg}
                </span>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
