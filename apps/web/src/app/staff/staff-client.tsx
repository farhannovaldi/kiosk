"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faPlay, faRotate, faForwardStep, faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

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
  is_active: boolean;
};

type Dashboard = {
  current: Queue | null;
  waiting_count: number;
  waiting_queues: Queue[];
  skipped_queues: Queue[];
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
    
    // Auto-refresh counters setiap 1 detik
    const interval = setInterval(loadCounters, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check jika loket yang dipilih sudah tidak aktif/dihapus
  useEffect(() => {
    if (counterId && counters.length > 0) {
      const selectedCounter = counters.find(c => c.id === counterId && c.is_active);
      if (!selectedCounter) {
        setCounterId(null);
        setDashboard(null);
        setError("Loket yang Anda pilih telah dinonaktifkan.");
      }
    }
  }, [counters, counterId]);

  useEffect(() => {
    if (!counterId) {
      return;
    }

    // Auto-refresh dashboard setiap 1 detik
    const interval = setInterval(() => {
      loadDashboard(counterId);
    }, 1000);

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
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui antrean.");
      // Auto-refresh setelah error untuk update list
      if (counterId) {
        setTimeout(() => {
          loadDashboard(counterId);
          setError(null);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const callSpecificQueue = async (queueId: number) => {
    if (!counterId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/queues/${queueId}/call`, {
        method: "POST",
        json: { counter_id: counterId },
      });
      await loadDashboard(counterId);
    } catch (err: any) {
      setError(err.message || "Gagal memanggil antrean.");
      // Auto-refresh setelah error untuk update list
      setTimeout(() => {
        loadDashboard(counterId);
        setError(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header subtitle="Dashboard Petugas Loket" showUser />

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {/* Counter Selection */}
        <div className="mb-8 rounded-[2rem] border-2 border-brand-200 bg-white p-8 shadow-xl">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-brand-700">Pilih Loket</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {counters.filter(c => c.is_active).map((counter) => (
              <button
                key={counter.id}
                onClick={() => handleCounterChange(String(counter.id))}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300 ${
                  counterId === counter.id
                    ? "border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-500/30 scale-105"
                    : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-lg hover:scale-102"
                }`}
              >
                {/* Background decoration */}
                <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full transition-all ${
                  counterId === counter.id ? "bg-white/20" : "bg-brand-50"
                }`} />
                
                {/* Checkmark for selected */}
                {counterId === counter.id && (
                  <div className="absolute right-3 top-3 z-10">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30 border border-white/50">
                      <svg className="h-4 w-4 text-white font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Counter content */}
                <div className="relative z-10">
                  <div className={`text-4xl font-black tracking-tight transition-colors ${
                    counterId === counter.id ? "text-white" : "text-brand-600 group-hover:text-brand-700"
                  }`}>
                    {counter.name.replace('Loket ', '')}
                  </div>
                  <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${
                    counterId === counter.id ? "text-brand-100" : "text-gray-500"
                  }`}>
                    {counter.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Stats */}
        {dashboard && (
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {/* Current Queue */}
            <div className={`relative overflow-hidden rounded-[2rem] border-2 p-8 shadow-2xl text-white ${
              dashboard.current?.status === 'serving' 
                ? 'border-green-200 bg-gradient-to-br from-green-500 to-emerald-700' 
                : 'border-brand-100 bg-gradient-to-br from-brand-500 to-brand-700'
            }`}>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              
              {/* Status Badge */}
              {dashboard.current && (
                <div className="relative z-10 mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    dashboard.current.status === 'serving' 
                      ? 'bg-white/30 text-white border border-white/50' 
                      : dashboard.current.status === 'called'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-white/20 text-white'
                  }`}>
                    {dashboard.current.status === 'serving' ? '🔵 Sedang Dilayani' : 
                     dashboard.current.status === 'called' ? '🔔 Dipanggil' : 
                     dashboard.current.status}
                  </span>
                </div>
              )}
              
              <p className="relative z-10 mb-2 text-sm font-bold uppercase tracking-widest text-brand-100">
                Nomor Dipanggil
              </p>
              <h2 className="relative z-10 text-6xl font-black tracking-tighter">
                {dashboard.current?.ticket_code || "-"}
              </h2>
              <p className="relative z-10 mt-4 text-sm font-medium text-brand-100">
                {dashboard.current?.service?.name || "Belum ada antrean"}
              </p>
            </div>

            {/* Waiting Count */}
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-accent-100 bg-gradient-to-br from-accent-300 to-accent-500 p-8 shadow-2xl text-brand-900">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
              <p className="relative z-10 mb-2 text-sm font-bold uppercase tracking-widest text-brand-800">
                Sisa Antrean
              </p>
              <h2 className="relative z-10 text-6xl font-black tracking-tighter">
                {dashboard.waiting_count}
              </h2>
              <p className="relative z-10 mt-4 text-sm font-medium text-brand-700">
                Menunggu dipanggil
              </p>
            </div>

            {/* Recent Completed */}
            <div className="rounded-[2rem] border-2 border-gray-200 bg-white p-8 shadow-xl">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
                Riwayat Selesai
              </p>
              <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {dashboard.recent_completed.length ? (
                  dashboard.recent_completed.map((queue) => (
                    <li key={queue.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm border border-gray-100">
                      <span className="font-bold text-gray-800">{queue.ticket_code}</span>
                      <span className="text-gray-500">{queue.service?.name}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-center text-gray-400 py-4">Belum ada data</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 rounded-[2rem] border-2 border-gray-200 bg-white p-8 shadow-xl">
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={callNext}
              disabled={!counterId || loading || !!dashboard?.current}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={dashboard?.current ? 'Selesaikan atau lewati antrean saat ini terlebih dahulu' : 'Panggil antrean berikutnya'}
            >
              <span className="relative z-10 flex items-center gap-2">
                <FontAwesomeIcon icon={faBullhorn} className="h-5 w-5" />
                Panggil Selanjutnya
              </span>
            </button>

            {dashboard?.current && (
              <>
                <button
                  type="button"
                  onClick={() => updateQueue(dashboard.current!.id, "start")}
                  disabled={loading || dashboard.current.status === 'serving'}
                  className={`rounded-xl border-2 px-6 py-4 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    dashboard.current.status === 'serving' 
                      ? 'border-green-500 bg-green-500 text-white' 
                      : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-500 hover:text-white'
                  }`}
                  title={dashboard.current.status === 'serving' ? 'Antrean sudah dilayani' : 'Tandai antrean sedang dilayani'}
                >
                  <FontAwesomeIcon icon={faPlay} className="h-4 w-4" />
                  {dashboard.current.status === 'serving' ? '✓ Sedang Dilayani' : 'Mulai Layani'}
                </button>
                <button
                  type="button"
                  onClick={() => updateQueue(dashboard.current!.id, "recall")}
                  disabled={loading || !['called', 'serving'].includes(dashboard.current.status)}
                  className="rounded-xl border-2 border-amber-500 bg-amber-50 px-6 py-4 font-bold text-amber-700 transition-all hover:bg-amber-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={['called', 'serving'].includes(dashboard.current.status) ? 'Panggil ulang nomor antrean (jika warga belum datang)' : 'Tidak bisa panggil ulang'}
                >
                  <FontAwesomeIcon icon={faRotate} className="h-4 w-4" />
                  Panggil Ulang
                </button>
                <button
                  type="button"
                  onClick={() => updateQueue(dashboard.current!.id, "skip")}
                  disabled={loading}
                  className="rounded-xl border-2 border-red-500 bg-red-50 px-6 py-4 font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faForwardStep} className="h-4 w-4" />
                  Lewati
                </button>
                <button
                  type="button"
                  onClick={() => updateQueue(dashboard.current!.id, "complete")}
                  disabled={loading}
                  className="rounded-xl border-2 border-green-500 bg-green-50 px-6 py-4 font-bold text-green-700 transition-all hover:bg-green-500 hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
                  Selesai
                </button>
              </>
            )}
          </div>
        </div>

        {/* Waiting & Skipped Queues */}
        {dashboard && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Waiting Queues */}
            <div className="rounded-[2rem] border-2 border-blue-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-black text-gray-800 mb-6">
                Antrean Menunggu ({dashboard.waiting_queues?.length || 0})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboard.waiting_queues && dashboard.waiting_queues.length > 0 ? (
                  dashboard.waiting_queues.map((queue) => (
                    <div
                      key={queue.id}
                      className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-blue-600">{queue.ticket_code}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 uppercase">{queue.service.code}</p>
                          <p className="font-semibold text-gray-800">{queue.service.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => callSpecificQueue(queue.id)}
                        disabled={loading || !!dashboard?.current}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={dashboard?.current ? 'Selesaikan atau lewati antrean saat ini terlebih dahulu' : 'Panggil antrean ini'}
                      >
                        <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 mr-2" />
                        Panggil
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8 italic">Tidak ada antrean menunggu.</p>
                )}
              </div>
            </div>

            {/* Skipped Queues */}
            <div className="rounded-[2rem] border-2 border-amber-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-black text-gray-800 mb-6">
                Antrean Dilewati ({dashboard.skipped_queues?.length || 0})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboard.skipped_queues && dashboard.skipped_queues.length > 0 ? (
                  dashboard.skipped_queues.map((queue) => (
                    <div
                      key={queue.id}
                      className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-amber-50 p-4 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-amber-600">{queue.ticket_code}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 uppercase">{queue.service.code}</p>
                          <p className="font-semibold text-gray-800">{queue.service.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => callSpecificQueue(queue.id)}
                        disabled={loading || !!dashboard?.current}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={dashboard?.current ? 'Selesaikan atau lewati antrean saat ini terlebih dahulu' : 'Panggil ulang antrean ini'}
                      >
                        <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 mr-2" />
                        Panggil Ulang
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8 italic">Tidak ada antrean dilewati.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 border-l-4 border-red-500 p-6 text-red-700 flex items-start gap-4 shadow-md">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">Terjadi Kesalahan</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
