"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Service = {
  id: number;
  code: string;
  name: string;
};

type Counter = {
  id: number;
  name: string;
  assigned_services: number[] | null;
  is_active: boolean;
};

type Requirement = {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
};

type QueueReport = {
  period: string;
  date: string;
  total_visitors: number;
  skipped: number;
  avg_wait_minutes: number | null;
};

type SurveyReport = {
  rating: number;
  total: number;
};

export default function AdminClient() {
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [queueReport, setQueueReport] = useState<QueueReport | null>(null);
  const [surveyReport, setSurveyReport] = useState<SurveyReport[]>([]);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serviceData, counterData, requirementData] = await Promise.all([
          apiFetch("/services?include_inactive=1"),
          apiFetch("/counters"),
          apiFetch("/requirements?include_inactive=1"),
        ]);
        setServices(serviceData as Service[]);
        setCounters(counterData as Counter[]);
        setRequirements(requirementData as Requirement[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [queueData, surveyData] = await Promise.all([
          apiFetch(`/reports/queues?period=${reportPeriod}&date=${reportDate}`),
          apiFetch("/reports/surveys"),
        ]);
        setQueueReport(queueData as QueueReport);
        setSurveyReport(surveyData as SurveyReport[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
      }
    };

    loadReports();
  }, [reportPeriod, reportDate]);

  const resetQueues = async () => {
    if (!window.confirm("Reset antrean hari ini?")) {
      return;
    }

    try {
      setError(null);
      const result = (await apiFetch("/admin/queues/reset", {
        method: "POST",
      })) as { deleted: number };
      setResetMessage(`Berhasil reset ${result.deleted} antrean hari ini.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset antrean.");
    }
  };

  const createRequirement = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi persyaratan wajib diisi.");
      return;
    }

    try {
      setError(null);
      const requirement = (await apiFetch("/requirements", {
        method: "POST",
        json: { title: title.trim(), content: content.trim(), is_active: true },
      })) as Requirement;
      setRequirements((prev) => [requirement, ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah persyaratan.");
    }
  };

  const toggleRequirement = async (requirement: Requirement) => {
    try {
      setError(null);
      const updated = (await apiFetch(`/requirements/${requirement.id}`, {
        method: "PATCH",
        json: { is_active: !requirement.is_active },
      })) as Requirement;
      setRequirements((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update persyaratan.");
    }
  };

  const editRequirement = async (requirement: Requirement) => {
    const nextTitle = window.prompt("Judul persyaratan", requirement.title);
    if (!nextTitle) {
      return;
    }
    const nextContent = window.prompt("Isi persyaratan", requirement.content);
    if (!nextContent) {
      return;
    }

    try {
      setError(null);
      const updated = (await apiFetch(`/requirements/${requirement.id}`, {
        method: "PATCH",
        json: { title: nextTitle.trim(), content: nextContent.trim() },
      })) as Requirement;
      setRequirements((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal edit persyaratan.");
    }
  };

  const deleteRequirement = async (requirement: Requirement) => {
    if (!window.confirm("Hapus persyaratan ini?")) {
      return;
    }

    try {
      setError(null);
      await apiFetch(`/requirements/${requirement.id}`, { method: "DELETE" });
      setRequirements((prev) =>
        prev.filter((item) => item.id !== requirement.id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus persyaratan.");
    }
  };

  const toggleCounterService = async (counter: Counter, serviceId: number) => {
    const assigned = counter.assigned_services ?? [];
    const nextAssigned = assigned.includes(serviceId)
      ? assigned.filter((id) => id !== serviceId)
      : [...assigned, serviceId];

    try {
      setError(null);
      const updated = (await apiFetch(`/counters/${counter.id}`, {
        method: "PATCH",
        json: { assigned_services: nextAssigned },
      })) as Counter;
      setCounters((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update loket.");
    }
  };

  const serviceName = (id: number) =>
    services.find((service) => service.id === id)?.name || "-";

  return (
    <div className="min-h-screen bg-slate-950 px-8 py-16 text-slate-100">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Admin Panel
            </p>
            <h1 className="text-3xl font-semibold">Konfigurasi Loket</h1>
          </div>
          <a
            href="/login"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Login
          </a>
        </div>

        <div className="grid gap-6">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-xl font-semibold">{counter.name}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Status: {counter.is_active ? "Aktif" : "Nonaktif"}
              </p>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Layanan Ditugaskan
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200">
                  {counter.assigned_services?.length ? (
                    counter.assigned_services.map((id) => (
                      <li key={id}>{serviceName(id)}</li>
                    ))
                  ) : (
                    <li>Belum ada layanan.</li>
                  )}
                </ul>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 text-xs text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={counter.assigned_services?.includes(service.id) || false}
                        onChange={() => toggleCounterService(counter, service.id)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      />
                      {service.code} - {service.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Persyaratan Layanan</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Judul
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Isi (pisahkan dengan baris baru)
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={createRequirement}
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950"
          >
            Tambah Persyaratan
          </button>

          <div className="mt-6 space-y-4">
            {requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{requirement.title}</p>
                    <p className="text-xs text-slate-500">
                      {requirement.is_active ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRequirement(requirement)}
                      className="rounded-xl border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {requirement.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => editRequirement(requirement)}
                      className="rounded-xl border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRequirement(requirement)}
                      className="rounded-xl border border-rose-500/40 px-3 py-1 text-xs text-rose-200"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {requirements.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada persyaratan.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Reset Antrean Hari Ini</h2>
          <p className="mt-2 text-sm text-slate-400">
            Gunakan tombol ini jika terjadi kesalahan fatal pada nomor antrean.
          </p>
          <button
            type="button"
            onClick={resetQueues}
            className="mt-4 rounded-xl border border-rose-500/40 px-4 py-2 text-sm text-rose-200"
          >
            Reset Antrean Hari Ini
          </button>
          {resetMessage ? (
            <p className="mt-3 text-sm text-emerald-200">{resetMessage}</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Laporan</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-slate-300">
              Periode
              <select
                value={reportPeriod}
                onChange={(event) => setReportPeriod(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100"
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Tanggal
              <input
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100"
              />
            </label>
          </div>

          {queueReport ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-400">Total Pengunjung</p>
                <p className="text-2xl font-semibold">{queueReport.total_visitors}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-400">Total Skipped</p>
                <p className="text-2xl font-semibold">{queueReport.skipped}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-400">Rata-rata Tunggu (menit)</p>
                <p className="text-2xl font-semibold">
                  {queueReport.avg_wait_minutes ?? "-"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Kepuasan Masyarakat
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[4, 3, 2, 1].map((rating) => {
                const item = surveyReport.find((report) => report.rating === rating);
                return (
                  <div
                    key={rating}
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <p className="text-xs text-slate-400">Rating {rating}</p>
                    <p className="text-xl font-semibold">{item?.total ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </div>
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
