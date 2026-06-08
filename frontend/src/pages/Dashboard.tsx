import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Reservation } from "../lib/types";
import { fetchReservations, syncEmails } from "../lib/api";
import {
  formatDate,
  formatCurrency,
  guestName,
  nightsCount,
  statusLabel,
  statusColor,
  hostServiceStatusLabel,
  hostServiceStatusColor,
} from "../lib/utils";

const PAGE_SIZE = 10;
const FILTERS = ["all", "confirmed", "completed", "cancelled"] as const;
type ReservationFilter = (typeof FILTERS)[number];

function getInitialPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getInitialFilter(value: string | null): ReservationFilter {
  return FILTERS.includes(value as ReservationFilter)
    ? (value as ReservationFilter)
    : "all";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationFilter>(() =>
    getInitialFilter(searchParams.get("filter")),
  );
  const [page, setPage] = useState(() =>
    getInitialPage(searchParams.get("page")),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialReservations() {
      try {
        const data = await fetchReservations();
        if (isMounted) {
          setReservations(data);
        }
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
        setPage(1);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filtered.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <p className="text-xs text-stone-500 bg-stone-100 rounded-md px-3 py-1.5 inline-block">
              {syncMsg}
            </p>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            {
              label: "Taxa host",
              value: formatCurrency(
                reservations.reduce(
                  (s, r) => s + Number(r.host_service_fee),
                  0,
                ),
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
          {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  filter === f
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-500 border border-stone-200 hover:border-stone-400"
                }`}
              >
                {f === "all" ? "Todas" : statusLabel[f]}
              </button>
            ))}
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
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
                    Taxa host
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Serviço
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs text-stone-400 font-medium uppercase tracking-widest px-5 py-3">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody
                key={`${filter}-${currentPage}`}
                className="page-fade-in divide-y divide-stone-50"
              >
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() =>
                      navigate(
                        `/reservations/${r.id}?dashboardPage=${currentPage}&dashboardFilter=${filter}`,
                      )
                    }
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
                    <td className="px-5 py-3.5 font-medium text-stone-700">
                      {formatCurrency(Number(r.host_service_fee), r.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${hostServiceStatusColor[r.host_service_status]}`}
                      >
                        {hostServiceStatusLabel[r.host_service_status]}
                      </span>
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
            <div className="border-t border-stone-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-stone-400">
                Mostrando {showingStart}-{showingEnd} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-stone-400 transition-colors disabled:opacity-40 disabled:hover:border-stone-200"
                >
                  Anterior
                </button>
                <span className="text-xs text-stone-400 px-1">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-stone-400 transition-colors disabled:opacity-40 disabled:hover:border-stone-200"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
