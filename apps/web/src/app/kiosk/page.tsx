import Link from "next/link";
import Header from "@/components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket, faClipboardList, faStar } from "@fortawesome/free-solid-svg-icons";

export default function KioskPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 to-white selection:bg-brand-200">
      <Header subtitle="Anjungan Antrian Mandiri" />

      <main className="container mx-auto flex max-w-7xl flex-1 flex-col justify-center px-4 py-12 md:px-8">
        <div className="relative mb-16 text-center">
          <div className="absolute inset-0 -z-10 bg-radial-gradient from-brand-100/40 to-transparent blur-3xl" />
          <h2 className="mb-4 bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-6xl">
            SELAMAT DATANG
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-brand-700/80 md:text-2xl font-medium">
            Silakan pilih layanan yang Anda butuhkan.
            <br className="hidden md:block" />
            <span className="mt-2 block font-semibold text-brand-600">
              Pelayanan Cepat, Mudah, dan Transparan.
            </span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-10">
          <Link
            href="/kiosk/queue"
            className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-brand-900/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-900/10 border border-brand-100/50"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Decorative Icon Background */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-brand-100/70 bg-brand-100/80 transition-all duration-700 group-hover:scale-110 group-hover:bg-brand-200/55" />

            {/* Icon */}
            <div className="relative z-10 mb-auto">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-4xl text-white shadow-lg shadow-brand-600/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-500 group-hover:shadow-brand-500/30">
                <FontAwesomeIcon icon={faTicket} className="h-10 w-10" />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-gray-800 transition-colors group-hover:text-brand-800">
                Ambil Antrean
              </h3>
              <p className="text-lg font-medium leading-relaxed text-gray-500 transition-colors group-hover:text-brand-700/80">
                Cetak nomor antrean layanan Anda dan tunggu panggilan.
              </p>
            </div>

            {/* Action Button */}
            <div className="relative z-10 mt-8 flex items-center justify-between border-t border-gray-100 pt-6 group-hover:border-brand-200">
              <span className="text-sm font-bold uppercase tracking-widest text-brand-400 transition-colors group-hover:text-brand-600">
                Mulai
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-400 shadow-md transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/kiosk/requirements"
            className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-brand-900/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-900/10 border border-brand-100/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-300/75 transition-all duration-700 group-hover:scale-110 group-hover:bg-accent-300/60" />

            <div className="relative z-10 mb-auto">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-400 text-4xl text-brand-900 shadow-lg shadow-accent-400/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-300 group-hover:shadow-accent-300/30">
                <FontAwesomeIcon icon={faClipboardList} className="h-10 w-10" />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-gray-800 transition-colors group-hover:text-brand-900">
                Persyaratan
              </h3>
              <p className="text-lg font-medium leading-relaxed text-gray-500 transition-colors group-hover:text-brand-700/80">
                Informasi lengkap dokumen yang dibutuhkan.
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center justify-between border-t border-gray-100 pt-6 group-hover:border-accent-200">
              <span className="text-sm font-bold uppercase tracking-widest text-accent-500 transition-colors group-hover:text-accent-600">
                Lihat
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent-400 shadow-md transition-all duration-300 group-hover:bg-accent-400 group-hover:text-brand-900 group-hover:shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/kiosk/survey"
            className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-brand-900/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-900/10 border border-brand-100/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-blue-100/80 bg-blue-100/70 transition-all duration-700 group-hover:scale-110 group-hover:bg-blue-200/45" />

            <div className="relative z-10 mb-auto">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-serdang-blue text-4xl text-white shadow-lg shadow-serdang-blue/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:shadow-blue-500/30">
                <FontAwesomeIcon icon={faStar} className="h-10 w-10" />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-gray-800 transition-colors group-hover:text-serdang-blue">
                Survei Kepuasan
              </h3>
              <p className="text-lg font-medium leading-relaxed text-gray-500 transition-colors group-hover:text-serdang-blue/80">
                Berikan penilaian Anda untuk meningkatkan layanan kami.
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center justify-between border-t border-gray-100 pt-6 group-hover:border-blue-200">
              <span className="text-sm font-bold uppercase tracking-widest text-serdang-blue transition-colors group-hover:text-blue-600">
                Nilai
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-serdang-blue shadow-md transition-all duration-300 group-hover:bg-serdang-blue group-hover:text-white group-hover:shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 bg-white/80 py-6 text-center backdrop-blur-md border-t border-brand-100">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-wide text-brand-800 opacity-90">
            &copy; {new Date().getFullYear()} Pemerintah Kabupaten Serdang Bedagai.
            <span className="ml-2 font-normal text-brand-600">Tanah Bertuah Negeri Beradat.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}


