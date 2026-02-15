"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

type DocumentStatus = {
  id: number;
  nik: string;
  name: string;
  document_type: string;
  status: "diproses" | "siap_diambil" | "diambil";
  pickup_counter: string | null;
  notes: string | null;
  updated_at: string;
};

const statusText: Record<DocumentStatus["status"], string> = {
  diproses: "DIPROSES",
  siap_diambil: "SIAP DIAMBIL",
  diambil: "SUDAH DIAMBIL",
};

export default function DocumentStatusClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentStatus | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = (await apiFetch("/document-status/check", {
        method: "POST",
        json: {
          token: token.trim() || undefined,
          nik: token.trim() ? undefined : (nik.trim() || undefined),
        },
      })) as { status: DocumentStatus };

      setResult(data.status);
    } catch (err: any) {
      setError(err.message || "Status dokumen tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <Header subtitle="Cek Status Dokumen" />

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <button
          type="button"
          onClick={() => router.push("/kiosk")}
          className="mb-6 rounded-xl border border-brand-200 bg-white px-5 py-2.5 font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-50"
        >
          ← Kembali
        </button>

        <div className="rounded-[2rem] border-2 border-brand-100 bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-3xl font-black text-brand-900">Cek Status Dokumen</h2>
          <p className="mb-6 text-gray-600">Scan token kartu kiosk atau masukkan NIK Anda.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Scan Token Kartu (opsional)"
              className="rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-800 focus:border-brand-500 focus:outline-none"
            />
            <input
              value={nik}
              onChange={(event) => setNik(event.target.value)}
              placeholder="NIK (jika tanpa token)"
              className="rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-800 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCheck}
            disabled={loading}
            className="mt-5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Memeriksa..." : "Cek Status"}
          </button>

          {error && (
            <div className="mt-5 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Status Terbaru</p>
              <h3 className="mt-1 text-2xl font-black text-emerald-800">{statusText[result.status]}</h3>
              <p className="mt-3 text-gray-700">Halo {result.name}, dokumen {result.document_type} Anda saat ini: <span className="font-bold">{statusText[result.status]}</span>.</p>
              <p className="mt-2 text-gray-700">{result.pickup_counter ? `Silakan ambil di ${result.pickup_counter}.` : "Silakan tanyakan ke petugas untuk loket pengambilan."}</p>
              {result.notes && <p className="mt-2 text-gray-600">Catatan: {result.notes}</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
