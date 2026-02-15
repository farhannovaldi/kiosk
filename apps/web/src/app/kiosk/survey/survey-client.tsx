"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faFaceGrinBeam, faFaceSmile, faFaceMeh, faFaceFrown } from "@fortawesome/free-regular-svg-icons";

type Option = {
  value: number;
  label: string;
  gradient: string;
  icon: any;
};

const options: Option[] = [
  { value: 4, label: "Sangat Puas", gradient: "from-emerald-400 to-green-600", icon: faFaceGrinBeam },
  { value: 3, label: "Puas", gradient: "from-sky-400 to-blue-600", icon: faFaceSmile },
  { value: 2, label: "Cukup", gradient: "from-amber-300 to-yellow-500", icon: faFaceMeh },
  { value: 1, label: "Kurang", gradient: "from-rose-400 to-red-600", icon: faFaceFrown },
];

export default function SurveyClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (value: number) => {
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/surveys", {
        method: "POST",
        json: { rating: value },
      });
      setSubmitted(true);
      setTimeout(() => router.push("/kiosk"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan survei.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-brand-50 flex flex-col">
        <Header subtitle="Survei Kepuasan" />
        <main className="container mx-auto max-w-2xl flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border-t-8 border-emerald-500">
            <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-white text-5xl shadow-lg mb-6 animate-bounce">
              <FontAwesomeIcon icon={faCircleCheck} className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-black text-brand-900 mb-3">Terima Kasih!</h2>
            <p className="text-lg text-gray-600 mb-8">Masukan Anda sangat berarti bagi kami untuk terus meningkatkan kualitas pelayanan.</p>
            <p className="text-sm text-gray-400">Otomatis kembali ke menu dalam 3 detik...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <Header subtitle="Survei Kepuasan" />
      
      <main className="container mx-auto max-w-6xl flex-1 px-6 py-12">
        <div className="mb-10">
          <Link
            href="/kiosk"
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-serdang-blue shadow-md transition-all hover:shadow-lg hover:bg-blue-50 border border-blue-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </Link>
          <h1 className="text-4xl font-black text-brand-900 mb-3">Bagaimana Pelayanan Kami?</h1>
          <p className="text-lg text-gray-700 font-medium">Pilih emoji sesuai dengan tingkat kepuasan Anda.</p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 border-l-4 border-red-500 p-6 text-red-700 flex items-start gap-4 shadow-md">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">Terjadi Kesalahan</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(option.value)}
              className="group relative overflow-hidden rounded-[2rem] border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 flex flex-col items-center min-h-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" />
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className={`mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${option.gradient} text-6xl text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-12`}>
                  <FontAwesomeIcon icon={option.icon} className="h-16 w-16" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900">{option.label}</h3>
              </div>
              
              <div className="mt-6 w-full border-t border-gray-100 pt-4 text-center">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600">Pilih</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
