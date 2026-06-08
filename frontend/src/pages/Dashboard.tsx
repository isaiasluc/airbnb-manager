import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Reservation } from "../lib/types";
import { fetchReservations, syncEmails } from "../lib/api";
import {
  formatDate,
  formatCurrency,
  guestName,
  nightsCount,
  statusLabel,
  statusColor,
} from "../lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "confirmed" | "completed" | "cancelled"
  >("all");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialReservations() {
      try {
        const data = await fetchReservations();
        if (isMounted) setReservations(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await syncEmails();
      setSyncMsg(
        `${result.imported} importada(s) · ${result.skipped} ignorada(s) · ${result.errors.length} erro(s)`,
      );
      if (result.imported > 0) {
        const data = await fetchReservations();
        setReservations(data);
      }
    } catch {
      setSyncMsg("Erro ao sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  const filtered =
    filter === "all"
      ? reservations
      : reservations.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
              Hospedagens
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              Apê dos sonhos em Ponta Negra
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {syncing ? "Sincronizando..." : "Sincronizar Gmail"}
          </button>
        </div>
        {syncMsg && (
          <div className="max-w-5xl mx-auto px-6 pb-3">
            <p className="text-xs text-stone-500 bg-stone-100 rounded-md px-3 py-1.5 inline-block">
              {syncMsg}
            </p>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: reservations.length },
            {
              label: "Confirmadas",
              value: reservations.filter((r) => r.status === "confirmed")
                .length,
            },
            {
              label: "Receita total",
              value: formatCurrency(
                reservations.reduce((s, r) => s + Number(r.host_payout), 0),
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-stone-200 px-5 py-4"
            >
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-stone-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-5">
          {(["all", "confirmed", "completed", "cancelled"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  filter === f
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-500 border border-stone-200 hover:border-stone-400"
                }`}
              >
                {f === "all" ? "Todas" : statusLabel[f]}
              </button>
            ),
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-stone-300 text-sm">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-300 gap-2">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Nenhuma reserva encontrada</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Hóspede
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Check-in
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Check-out
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Noites
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Payout
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reservations/${r.id}`)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-stone-800 group-hover:text-stone-900">
                        {guestName(r.guest_first_name, r.guest_last_name)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {formatDate(r.checkin_at)}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {formatDate(r.checkout_at)}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {nightsCount(r.checkin_at, r.checkout_at)}n
                    </td>
                    <td className="px-5 py-3.5 font-medium text-stone-700">
                      {formatCurrency(Number(r.host_payout))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${statusColor[r.status]}`}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.email_sent ? (
                        <span className="text-emerald-500">✓</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
