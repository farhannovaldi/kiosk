"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
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

export default function QueueClient({ services: initialServices }: { services: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh services setiap 1 detik
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await apiFetch("/services") as Service[];
        setServices(data);
      } catch (err) {
        console.error("Gagal reload layanan:", err);
      }
    };

    const interval = setInterval(loadServices, 1000); // 1 detik
    return () => clearInterval(interval);
  }, []);

  // Auto print ketika ticket berhasil diambil
  useEffect(() => {
    if (ticket) {
      // Tunggu sebentar agar UI selesai render
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [ticket]);

  const handleSelect = async (serviceId: number) => {
    if (loadingId !== null) return;
    setLoadingId(serviceId);
    setError(null);

    try {
      const data = await apiFetch("/queues", {
        method: "POST",
        json: { service_id: serviceId },
      }) as QueueResponse;
      
      setTicket(data);
      
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
        <>
          <style jsx global>{`
            @media print {
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                width: 80mm;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
            @media screen {
              .print-only {
                display: none;
              }
            }
          `}</style>
          
          {/* Screen Version */}
          <div className="no-print flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-brand-50">
              <Header subtitle="Tiket Antrian Anda" />
              
              <main className="container mx-auto flex max-w-2xl flex-1 flex-col justify-center px-6 py-12">
                  <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-12 border-t-8 border-brand-600 overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-50" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-50 rounded-full -ml-24 -mb-24 opacity-50" />
                      
                      <div className="relative z-10 text-center space-y-6">
                          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white text-5xl shadow-lg animate-bounce">
                              ✓
                          </div>
                          
                          <div>
                              <h2 className="text-3xl font-black text-brand-900 mb-2">Berhasil!</h2>
                              <p className="text-gray-600 font-medium">Silakan ambil tiket yang telah dicetak</p>
                          </div>

                          <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-8 shadow-xl border-4 border-white">
                              <p className="text-sm font-bold uppercase tracking-widest text-brand-100 mb-3">Nomor Antrian Anda</p>
                              <div className="text-8xl font-black text-white tracking-tighter drop-shadow-lg">
                                  {ticket.queue.ticket_code}
                              </div>
                              <p className="mt-6 text-xl font-bold text-brand-50">{ticket.queue.service.name}</p>
                          </div>

                          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-6 py-4 border border-gray-200">
                              <span className="text-sm font-semibold text-gray-600">Menunggu:</span>
                              <span className="text-2xl font-black text-brand-600">{ticket.waiting_count} Orang</span>
                          </div>

                          <p className="text-sm text-gray-400 mt-6">
                              Otomatis kembali ke menu dalam 5 detik...
                          </p>
                      </div>
                  </div>
              </main>
          </div>

          {/* Print Version - Thermal Printer 80mm Full Width */}
          <div className="print-only" style={{ 
            width: '80mm', 
            margin: 0,
            padding: '8mm 5mm',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            backgroundColor: 'white'
          }}>
              <div style={{ 
                textAlign: 'center', 
                borderBottom: '2px dashed black', 
                paddingBottom: '5mm', 
                marginBottom: '5mm' 
              }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2mm', letterSpacing: '0.5px' }}>
                      KABUPATEN SERDANG BEDAGAI
                  </div>
                  <div style={{ fontSize: '9px', marginBottom: '2mm' }}>
                      Sistem Antrian Digital
                  </div>
              </div>

              <div style={{ textAlign: 'center', margin: '6mm 0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4mm', letterSpacing: '1px' }}>
                      NOMOR ANTRIAN
                  </div>
                  <div style={{ 
                      fontSize: '52px', 
                      fontWeight: 'bold', 
                      letterSpacing: '4px',
                      border: '4px solid black',
                      padding: '10mm 0',
                      margin: '4mm 0',
                      width: '100%'
                  }}>
                      {ticket.queue.ticket_code}
                  </div>
              </div>

              <div style={{ 
                textAlign: 'center', 
                borderTop: '2px dashed black', 
                paddingTop: '5mm', 
                marginTop: '5mm' 
              }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '3mm' }}>
                      {ticket.queue.service.name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#444', marginBottom: '2mm' }}>
                      Antrian di depan: {ticket.waiting_count} orang
                  </div>
                  <div style={{ 
                    fontSize: '8px', 
                    color: '#666', 
                    marginTop: '4mm', 
                    paddingTop: '3mm', 
                    borderTop: '1px solid #ccc' 
                  }}>
                      {new Date(ticket.queue.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                  </div>
              </div>

              <div style={{ 
                textAlign: 'center', 
                fontSize: '8px', 
                marginTop: '6mm', 
                paddingTop: '4mm', 
                borderTop: '1px dashed #999' 
              }}>
                  Terima kasih atas kunjungan Anda
              </div>
          </div>
        </>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 to-white">
      <Header subtitle="Pilih Layanan" />

      <main className="container mx-auto flex max-w-7xl flex-1 flex-col px-6 py-12">
        <div className="mb-10">
            <button 
                onClick={() => router.push('/kiosk')}
                className="mb-6 flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-brand-600 shadow-md transition-all hover:shadow-lg hover:bg-brand-50 border border-brand-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Kembali
            </button>
            <h2 className="text-4xl font-black text-brand-900 mb-3">Pilih Jenis Layanan</h2>
            <p className="text-lg text-brand-700 font-medium">Silakan pilih layanan yang sesuai dengan keperluan Anda.</p>
        </div>

        {error && (
            <div className="mb-8 rounded-2xl bg-red-50 border-l-4 border-red-500 p-6 text-red-700 flex items-start gap-4 shadow-md">
                <span className="text-3xl">⚠️</span>
                <div>
                    <h3 className="font-bold mb-1">Terjadi Kesalahan</h3>
                    <p>{error}</p>
                </div>
            </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.filter(s => s.is_active !== false).map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              disabled={loadingId !== null}
              className="group relative flex flex-col min-h-[300px] overflow-hidden rounded-[2rem] border-2 border-brand-100 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-brand-500 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-70 text-left"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-brand-200" />

               <div className="relative z-10 flex-1">
                   <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-xl font-black text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        {service.code}
                   </span>
                   <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-brand-800 line-clamp-2">
                        {service.name}
                   </h3>
                   <p className="text-gray-500 line-clamp-3 group-hover:text-brand-700">
                        {service.description || "Klik untuk mengambil nomor antrian pada layanan ini."}
                   </p>
               </div>

               <div className="relative z-10 mt-6 flex items-center justify-between border-t border-gray-100 pt-4 group-hover:border-brand-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-brand-500">
                        {loadingId === service.id ? "Memproses..." : "Pilih"}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-all group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-lg">
                        {loadingId === service.id ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        )}
                    </div>
               </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
