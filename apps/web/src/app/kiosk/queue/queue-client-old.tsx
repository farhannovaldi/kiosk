"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
// Remove hardcoded service data if necessary, but keep the props for now.
// The file seems to receive 'services' prop.

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

type QueueResponse = {
  message: string;
  queue: {
    id: number;
    ticket_code: string;
    ticket_number: number;
    service: Service;
    created_at: string;
  };
  waiting_count: number;
};

export default function QueueClient({ services }: { services: Service[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (serviceId: number) => {
    if (loadingId !== null) return;
    setLoadingId(serviceId);
    setError(null);

    try {
      // The API endpoint might need adjustment based on valid routes. 
      // Assuming existing route is correct: POST /queues
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api'}/queues`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ service_id: serviceId }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil antrian");
      }

      const data = await response.json() as QueueResponse;
      setTicket(data);
      
      // Auto redirect after 5 seconds
      setTimeout(() => {
        router.push("/kiosk");
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan sistem, silakan coba lagi.");
    } finally {
      setLoadingId(null);
    }
  };

  if (ticket) {
      return (
        <div className="flex min-h-screen flex-col bg-brand-50 font-sans text-brand-900">
            <Header subtitle="Tiket Antrian" />
            
            <main className="container mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-12 text-center">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-brand-500 animate-fade-in-up">
                    <div className="mb-4">
                        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-4xl">
                            ✅
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
                    <p className="text-gray-500 mb-8">Silakan ambil tiket yang telah dicetak.</p>

                    <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100 mb-6">
                        <p className="text-sm uppercase tracking-widest text-brand-500 font-semibold mb-2">Nomor Antrian</p>
                        <div className="text-6xl font-black text-brand-900 tracking-tighter">
                            {ticket.queue.ticket_code}
                        </div>
                        <p className="mt-4 text-lg font-bold text-brand-700">{ticket.queue.service.name}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                        <span>Menunggu:</span>
                        <span className="text-brand-600 font-bold">{ticket.waiting_count} Orang</span>
                    </div>

                    <p className="mt-8 text-xs text-gray-400">
                        Halaman akan kembali ke menu utama dalam 5 detik...
                    </p>
                </div>
            </main>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 font-sans text-brand-900">
      <Header subtitle="Pilih Layanan" />

      <main className="container mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-10">
            <button 
                onClick={() => router.push('/kiosk')}
                className="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-brand-600 transition-colors"
            >
                ← Kembali ke Menu Utama
            </button>
            <h2 className="text-3xl font-extrabold text-brand-900">Pilih Jenis Layanan</h2>
            <p className="text-brand-700 mt-2">Silakan pilih layanan yang sesuai dengan keperluan Anda.</p>
        </div>

        {error && (
            <div className="mb-8 rounded-xl bg-red-50 p-4 text-red-700 border border-red-200 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                {error}
            </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              disabled={loadingId !== null}
              className="group relative flex flex-col items-start justify-between rounded-2xl border-2 border-transparent bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 text-left h-64"
            >
               <div className="absolute right-0 top-0 h-24 w-24 bg-brand-50 rounded-bl-[4rem] group-hover:bg-brand-100 transition-colors" />

               <div className="z-10 w-full">
                   <span className="inline-block rounded-lg bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        {service.code}
                   </span>
                   <h3 className="text-xl font-bold text-gray-800 group-hover:text-brand-800 transition-colors line-clamp-2">
                        {service.name}
                   </h3>
                   <p className="mt-2 text-sm text-gray-500 line-clamp-3 group-hover:text-gray-600">
                        {service.description || "Klik untuk mengambil nomor antrian pada layanan ini."}
                   </p>
               </div>

               <div className="z-10 mt-4 flex w-full items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-gray-400 group-hover:text-brand-500">
                        Pilih Layanan
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all">
                        +
                    </div>
               </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

