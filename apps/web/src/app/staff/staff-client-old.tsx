"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Service = {
  id: number;
  code: string;
  name: string;
};

type Queue = {
  id: number;
  ticket_code: string;
  status: string;
  service: Service;
};

type Counter = {
  id: number;
  name: string;
  assigned_services: number[] | null;
};

type Dashboard = {
  current: Queue | null;
  waiting_count: number;
  recent_completed: Queue[];
};

export default function StaffClient() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [counterId, setCounterId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCounters = async () => {
      try {
        const data = (await apiFetch("/counters")) as Counter[];
        setCounters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat counter.");
      }
    };

    loadCounters();
  }, []);

  useEffect(() => {
    if (!counterId) {
      return;
    }

    const interval = setInterval(() => {
      loadDashboard(counterId);
    }, 5000);

    return () => clearInterval(interval);
  }, [counterId]);

  const loadDashboard = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = (await apiFetch(`/dashboard?counter_id=${id}`)) as Dashboard;
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleCounterChange = (value: string) => {
    const id = Number(value);
    setCounterId(id);
    loadDashboard(id);
  };

  const callNext = async () => {
    if (!counterId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/queues/call-next", {
        method: "POST",
        json: { counter_id: counterId },
      });
      await loadDashboard(counterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memanggil antrean.");
    } finally {
      setLoading(false);
    }
  };

  const updateQueue = async (queueId: number, action: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/queues/${queueId}/${action}`, { method: "POST" });
      if (counterId) {
        await loadDashboard(counterId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui antrean.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-8 py-16 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Staff Dashboard
            </p>
            <h1 className="text-3xl font-semibold">Loket Pelayanan</h1>
          </div>
          <a
            href="/login"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Login
          </a>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <label className="block text-sm text-slate-300">
            Pilih Loket
            <select
              value={counterId ?? ""}
              onChange={(event) => handleCounterChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100"
            >
              <option value="" disabled>
                Pilih loket
              </option>
              {counters.map((counter) => (
                <option key={counter.id} value={counter.id}>
                  {counter.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {dashboard ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Nomor Dipanggil
              </p>
              <h2 className="mt-3 text-4xl font-semibold">
                {dashboard.current?.ticket_code || "-"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {dashboard.current?.service?.name || "Belum ada antrean"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Sisa Antrean
              </p>
              <h2 className="mt-3 text-4xl font-semibold">
                {dashboard.waiting_count}
              </h2>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Riwayat Selesai
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {dashboard.recent_completed.length ? (
                  dashboard.recent_completed.map((queue) => (
                    <li key={queue.id}>
                      {queue.ticket_code} - {queue.service?.name}
                    </li>
                  ))
                ) : (
                  <li>Belum ada data.</li>
                )}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={callNext}
            disabled={!counterId || loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
          >
            Panggil Selanjutnya
          </button>

          {dashboard?.current ? (
            <>
              <button
                type="button"
                onClick={() => updateQueue(dashboard.current!.id, "start")}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Mulai Layani
              </button>
              <button
                type="button"
                onClick={() => updateQueue(dashboard.current!.id, "recall")}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Panggil Ulang
              </button>
              <button
                type="button"
                onClick={() => updateQueue(dashboard.current!.id, "skip")}
                disabled={loading}
                className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm text-rose-200"
              >
                Lewati
              </button>
              <button
                type="button"
                onClick={() => updateQueue(dashboard.current!.id, "complete")}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Selesai
              </button>
            </>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <a
          href="/"
          className="inline-flex items-center rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
        >
          Kembali
        </a>
      </div>
    </div>
  );
}
