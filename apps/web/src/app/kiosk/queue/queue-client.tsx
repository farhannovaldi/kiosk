"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import QRCode from "qrcode";

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

type QueueResponse = {
  queue: {
    id: number;
    ticket_code: string;
    ticket_number: number;
    service: Service;
    created_at: string;
  };
  waiting_count: number;
  visitor?: Visitor | null;
  is_new_visitor?: boolean;
};

type Visitor = {
  id: number;
  nik: string;
  name: string;
  qr_code_string: string;
};

export default function QueueClient({ services: initialServices }: { services: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visitorNik, setVisitorNik] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorToken, setVisitorToken] = useState("");
  const [resolvedVisitor, setResolvedVisitor] = useState<Visitor | null>(null);
  const [resolvingVisitor, setResolvingVisitor] = useState(false);
  const [cameraEnabled] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [memberQrDataUrl, setMemberQrDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    const setupCamera = async () => {
      if (!cameraEnabled || typeof navigator === "undefined") {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setCameraReady(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (err) {
        setCameraError("Kamera tidak dapat diakses. Beri izin kamera pada browser kiosk.");
        setCameraReady(false);
      }
    };

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraEnabled]);

  // Auto print ketika ticket berhasil diambil
  useEffect(() => {
    if (ticket) {
      // Tunggu sebentar agar UI selesai render
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [ticket]);

  useEffect(() => {
    const renderMemberQr = async () => {
      if (!ticket?.is_new_visitor || !ticket.visitor?.qr_code_string) {
        setMemberQrDataUrl(null);
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(ticket.visitor.qr_code_string, {
          width: 180,
          margin: 1,
        });
        setMemberQrDataUrl(dataUrl);
      } catch {
        setMemberQrDataUrl(null);
      }
    };

    renderMemberQr();
  }, [ticket]);

  const captureFaceSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!cameraEnabled || !cameraReady || !video || !canvas) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  };

  const handleSelect = async (serviceId: number) => {
    if (loadingId !== null) return;

    const normalizedToken = visitorToken.trim();
    const normalizedNik = visitorNik.trim();
    const normalizedName = visitorName.trim();

    if (!normalizedToken && !normalizedNik) {
      setError("Isi NIK warga atau scan token terlebih dahulu.");
      return;
    }

    if (!normalizedToken && !resolvedVisitor && !normalizedName) {
      setError("Nama wajib diisi untuk warga baru.");
      return;
    }

    setLoadingId(serviceId);
    setError(null);

    try {
      const faceCaptureBase64 = captureFaceSnapshot();

      const data = await apiFetch("/queues", {
        method: "POST",
        json: {
          service_id: serviceId,
          visitor_token: normalizedToken || undefined,
          visitor_nik: normalizedToken ? undefined : normalizedNik,
          visitor_name: normalizedToken
            ? undefined
            : (resolvedVisitor?.name || normalizedName || undefined),
          face_capture_base64: faceCaptureBase64 || undefined,
        },
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

  const resolveVisitorByToken = async () => {
    const token = visitorToken.trim();
    if (!token) {
      setError("Token wajib diisi sebelum scan/cari.");
      return;
    }

    setResolvingVisitor(true);
    setError(null);
    try {
      const data = (await apiFetch("/visitors/resolve", {
        method: "POST",
        json: { token },
      })) as { visitor: Visitor };

      setResolvedVisitor(data.visitor);
      setVisitorNik(data.visitor.nik);
      setVisitorName(data.visitor.name);
    } catch (err: any) {
      setResolvedVisitor(null);
      setVisitorNik("");
      setVisitorName("");
      setError(err.message || "Token tidak dikenali. Gunakan input NIK untuk warga baru.");
    } finally {
      setResolvingVisitor(false);
    }
  };

  const clearVisitor = () => {
    setVisitorToken("");
    setVisitorNik("");
    setVisitorName("");
    setResolvedVisitor(null);
    setError(null);
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

              {ticket.is_new_visitor && ticket.visitor && (
                <div style={{ pageBreakBefore: 'always', marginTop: '10mm' }}>
                  <div style={{ 
                    textAlign: 'center', 
                    border: '4px solid black', 
                    padding: '4mm',
                    marginBottom: '4mm'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2mm' }}>KARTU MEMBER KIOSK</div>
                    <div style={{ fontSize: '9px', marginBottom: '2mm' }}>SIMPAN KARTU INI UNTUK KUNJUNGAN BERIKUTNYA</div>
                  </div>
                  <div style={{ fontSize: '11px', marginBottom: '2mm' }}><strong>Nama:</strong> {ticket.visitor.name}</div>
                  <div style={{ fontSize: '11px', marginBottom: '2mm' }}><strong>NIK:</strong> {ticket.visitor.nik}</div>
                  {memberQrDataUrl && (
                    <div style={{ textAlign: 'center', marginTop: '4mm', marginBottom: '4mm' }}>
                      <img
                        src={memberQrDataUrl}
                        alt="QR Token Member"
                        style={{ width: '34mm', height: '34mm', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: '9px', marginTop: '4mm', borderTop: '1px dashed #999', paddingTop: '3mm' }}>
                    Token: {ticket.visitor.qr_code_string}
                  </div>
                </div>
              )}
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

        <div className="mb-8 rounded-3xl border-2 border-brand-100 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-black text-brand-900">Identitas Warga</h3>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-600">Scan Token Lama</span>
              <input
                value={visitorToken}
                onChange={(event) => setVisitorToken(event.target.value)}
                placeholder="Tempel QR token di scanner"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-800 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-600">NIK</span>
              <input
                value={visitorNik}
                onChange={(event) => {
                  setVisitorNik(event.target.value);
                  if (resolvedVisitor && event.target.value !== resolvedVisitor.nik) {
                    setResolvedVisitor(null);
                  }
                }}
                placeholder="16 digit NIK"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-800 focus:border-brand-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-600">Nama Warga</span>
              <input
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                placeholder="Wajib untuk warga baru"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-800 focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resolveVisitorByToken}
              disabled={resolvingVisitor}
              className="rounded-xl border-2 border-brand-500 bg-brand-50 px-5 py-2.5 font-bold text-brand-700 transition-all hover:bg-brand-500 hover:text-white disabled:opacity-50"
            >
              {resolvingVisitor ? "Memeriksa Token..." : "Scan / Cek Token"}
            </button>
            <button
              type="button"
              onClick={clearVisitor}
              className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-700 transition-all hover:bg-gray-100"
            >
              Reset Identitas
            </button>
            {resolvedVisitor && (
              <span className="inline-flex items-center rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 border border-green-200">
                Warga lama terdeteksi: {resolvedVisitor.name}
              </span>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-600">Bukti Hadir Visual (Kamera)</p>
                <p className="text-xs text-gray-500">Kamera aktif otomatis. Foto diambil saat tombol pilih layanan ditekan.</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="aspect-[4/3] w-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {cameraEnabled && cameraReady && !cameraError && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">Kamera aktif. Snapshot otomatis saat cetak tiket.</p>
            )}
            {cameraError && (
              <p className="mt-2 text-xs font-semibold text-red-600">{cameraError}</p>
            )}
          </div>
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
