import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import type { Reservation, SyncResult, SyncStatus } from "../lib/types";
import {
  fetchReservations,
  fetchSyncStatus,
  syncEmails,
  type ReservationDateFilters,
} from "../lib/api";
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
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getInitialPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getInitialFilter(value: string | null): ReservationFilter {
  return FILTERS.includes(value as ReservationFilter)
    ? (value as ReservationFilter)
    : "all";
}

function getInitialDate(value: string | null) {
  return value && DATE_PARAM_PATTERN.test(value) ? value : "";
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    from: formatInputDate(start),
    to: formatInputDate(end),
  };
}

function getNext30DaysRange() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + 30);
  return {
    from: formatInputDate(start),
    to: formatInputDate(end),
  };
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
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-200 py-8 text-stone-300 dark:border-stone-700 dark:text-stone-500">
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
        className={`sync-modal-panel max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-stone-900 ${
          isClosing ? "sync-modal-panel-exit" : "sync-modal-panel-enter"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Detalhes da sincronização
            </h2>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
              {result.imported} importada(s) · {result.skipped} ignorada(s) ·{" "}
              {result.errors.length} erro(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Importadas
            </h3>
            {result.importedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva importada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.importedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
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
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Ignoradas
            </h3>
            {result.skippedItems.length === 0 ? (
              <EmptySyncList label="Nenhuma reserva ignorada" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.skippedItems.map((item) => (
                  <div key={item.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {item.guestName || item.subject || item.emailId}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      {item.reason || "Ignorada"} · {item.emailId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Erros
            </h3>
            {result.errors.length === 0 ? (
              <EmptySyncList label="Nenhum erro encontrado" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                {result.errors.map((error) => (
                  <div key={error.emailId} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [dateFrom, setDateFrom] = useState(() =>
    getInitialDate(searchParams.get("from")),
  );
  const [dateTo, setDateTo] = useState(() =>
    getInitialDate(searchParams.get("to")),
  );

  useEffect(() => {
    let isMounted = true;
    const dateFilters: ReservationDateFilters = {
      from: dateFrom || undefined,
      to: dateTo || undefined,
    };

    async function loadInitialReservations() {
      setLoading(true);
      try {
        const [data, status] = await Promise.all([
          fetchReservations(dateFilters),
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
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (filter !== "all") params.set("filter", filter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    setSearchParams(params, { replace: true });
  }, [dateFrom, dateTo, filter, page, setSearchParams]);

  function getDateFilters(): ReservationDateFilters {
    return {
      from: dateFrom || undefined,
      to: dateTo || undefined,
    };
  }

  function applyDateRange(filters: Required<ReservationDateFilters>) {
    setDateFrom(filters.from);
    setDateTo(filters.to);
    setPage(1);
  }

  function clearDateRange() {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function buildReservationPath(id: number) {
    const params = new URLSearchParams({
      dashboardPage: String(currentPage),
      dashboardFilter: filter,
    });
    if (dateFrom) params.set("dashboardFrom", dateFrom);
    if (dateTo) params.set("dashboardTo", dateTo);
    return `/reservations/${id}?${params.toString()}`;
  }

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
        const data = await fetchReservations(getDateFilters());
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
    setDateFrom("");
    setDateTo("");
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
    <div className="min-h-screen bg-stone-50 font-sans transition-colors dark:bg-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-950">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={handleHomeClick}
            className="text-left group"
          >
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight transition-colors group-hover:text-stone-600 dark:text-stone-100 dark:group-hover:text-stone-300">
              Hospedagens
            </h1>
            <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">
              Apê dos sonhos em Ponta Negra
            </p>
          </button>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                Início
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                Fim
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition-colors focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:focus:border-stone-500"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => applyDateRange(getCurrentMonthRange())}
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                Este mês
              </button>
              <button
                type="button"
                onClick={() => applyDateRange(getNext30DaysRange())}
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                Próximos 30 dias
              </button>
              <button
                type="button"
                onClick={clearDateRange}
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                Todos
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex h-9 items-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-300"
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
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Último sync{syncStatus?.lastSyncSource ? ` ${formatSyncSource(syncStatus.lastSyncSource)}` : ""}:{" "}
            {formatLastSync(syncStatus?.lastSyncAt ?? null)}
          </p>
        </div>
        {syncMsg && (
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <button
              type="button"
              onClick={openSyncModal}
              className="inline-block rounded-md bg-stone-100 px-3 py-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
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
              className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors dark:border-stone-800 dark:bg-stone-900"
            >
              <p className="mb-1 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
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
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950"
                    : "bg-white text-stone-500 border border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
                }`}
              >
                {f === "all" ? "Todas" : statusLabel[f]}
              </button>
            ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-stone-300 dark:text-stone-600">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-stone-300 dark:text-stone-600">
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
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Hóspede
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Check-in
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Check-out
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Noites
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Payout
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Taxa host
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Serviço
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody
                key={`${filter}-${currentPage}`}
                className="page-fade-in divide-y divide-stone-50 dark:divide-stone-800"
              >
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(buildReservationPath(r.id))}
                    className="group cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/70"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-stone-800 group-hover:text-stone-900 dark:text-stone-200 dark:group-hover:text-white">
                        {guestName(r.guest_first_name, r.guest_last_name)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                      {formatDate(r.checkin_at)}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                      {formatDate(r.checkout_at)}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400">
                      {nightsCount(r.checkin_at, r.checkout_at)}n
                    </td>
                    <td className="px-5 py-3.5 font-medium text-stone-700 dark:text-stone-300">
                      {formatCurrency(Number(r.host_payout))}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-stone-700 dark:text-stone-300">
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
                        <span className="text-stone-300 dark:text-stone-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Mostrando {showingStart}-{showingEnd} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-40 disabled:hover:border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500 dark:disabled:hover:border-stone-700"
                >
                  Anterior
                </button>
                <span className="px-1 text-xs text-stone-400 dark:text-stone-500">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-40 disabled:hover:border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500 dark:disabled:hover:border-stone-700"
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
