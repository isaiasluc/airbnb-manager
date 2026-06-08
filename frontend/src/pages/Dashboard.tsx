import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Reservation, SyncResult, SyncStatus } from "../lib/types";
import { fetchReservations, fetchSyncStatus, syncEmails } from "../lib/api";
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
const SYNC_MODAL_ANIMATION_MS = 180;
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

function formatLastSync(value: string | null) {
  if (!value) return "Nunca sincronizado";

  const date = new Date(value);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", "h");

  return `${formattedDate}, ${formattedTime}`;
}

function formatSyncSource(source: SyncStatus["lastSyncSource"]) {
  if (source === "cron") return "via cron";
  if (source === "manual") return "manual";
  return "";
}

function EmptySyncList({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 py-8 text-stone-300 gap-2">
      <svg
        className="h-9 w-9"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function SyncResultModal({
  result,
  isClosing,
  onClose,
}: {
  result: SyncResult;
  isClosing: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`sync-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-6 ${
        isClosing ? "sync-modal-overlay-exit" : "sync-modal-overlay-enter"
      }`}
      onClick={onClose}
    >
      <div
        className={`sync-modal-panel max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl ${
          isClosing ? "sync-modal-panel-exit" : "sync-modal-panel-enter"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Detalhes da sincronização
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {result.imported} importada(s) · {result.skipped} ignorada(s) ·{" "}
              {result.errors.length} erro(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Fechar modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(86vh-82px)] overflow-y-auto px-5 py-5 space-y-6">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-3">
              Importadas
            </h3>
            {result.importedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva importada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100">
                {result.importedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {item.confirmationCode
                        ? `Código ${item.confirmationCode}`
                        : item.emailId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-3">
              Ignoradas
            </h3>
            {result.skippedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva ignorada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100">
                {result.skippedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {item.reason || "Ignorada"} · {item.emailId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-3">
              Erros
            </h3>
            {result.errors.length === 0 ? (
              <EmptySyncList label="Nenhum erro encontrado" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100">
                {result.errors.map((error) => (
                  <div key={error.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">
                      {error.emailId}
                    </p>
                    <p className="text-xs text-rose-500 mt-1">
                      {error.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncModalClosing, setIsSyncModalClosing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
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
        const [data, status] = await Promise.all([
          fetchReservations(),
          fetchSyncStatus().catch(() => null),
        ]);
        if (isMounted) {
          setReservations(data);
          setSyncStatus(status);
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
    setSyncResult(null);
    setIsSyncModalOpen(false);
    setIsSyncModalClosing(false);
    try {
      const result = await syncEmails();
      if (result.syncStatus) setSyncStatus(result.syncStatus);
      setSyncResult(result);
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

  async function handleHomeClick() {
    navigate("/", { replace: true });
    setFilter("all");
    setPage(1);
    setLoading(true);
    setSyncMsg(null);

    try {
      const data = await fetchReservations();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  }

  function openSyncModal() {
    if (!syncResult) return;
    setIsSyncModalClosing(false);
    setIsSyncModalOpen(true);
  }

  function closeSyncModal() {
    setIsSyncModalClosing(true);
    window.setTimeout(() => {
      setIsSyncModalOpen(false);
      setIsSyncModalClosing(false);
    }, SYNC_MODAL_ANIMATION_MS);
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
          <button
            type="button"
            onClick={handleHomeClick}
            className="text-left group"
          >
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight group-hover:text-stone-600 transition-colors">
              Hospedagens
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              Apê dos sonhos em Ponta Negra
            </p>
          </button>
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
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <p className="text-xs text-stone-400">
            Último sync{syncStatus?.lastSyncSource ? ` ${formatSyncSource(syncStatus.lastSyncSource)}` : ""}:{" "}
            {formatLastSync(syncStatus?.lastSyncAt ?? null)}
          </p>
        </div>
        {syncMsg && (
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <button
              type="button"
              onClick={openSyncModal}
              className="text-xs text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-md px-3 py-1.5 inline-block transition-colors"
            >
              {syncMsg}
            </button>
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
      {isSyncModalOpen && syncResult && (
        <SyncResultModal
          result={syncResult}
          isClosing={isSyncModalClosing}
          onClose={closeSyncModal}
        />
      )}
    </div>
  );
}
