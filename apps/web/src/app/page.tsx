import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTablet, faUsers, faGear, faBullhorn } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-8 py-16">
        <header className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-20">
              <Image 
                src="/Logo.png"
                alt="Logo Serdang Bedagai" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>
          <span className="inline-block py-2 px-6 rounded-full bg-brand-100 text-brand-700 text-sm font-bold tracking-wider uppercase shadow-sm border border-brand-200">
            Sistem Antrian Digital
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-brand-900">
            Kabupaten <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">Serdang Bedagai</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 font-medium">
            Pilih area aplikasi untuk memulai pelayanan digital yang cepat, mudah, dan transparan.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/kiosk"
            className="group relative overflow-hidden rounded-[2rem] border-2 border-brand-100 bg-white p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-brand-500 hover:shadow-2xl"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-brand-200" />
            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <FontAwesomeIcon icon={faTablet} className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-brand-800">Kiosk</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Layar sentuh warga: ambil antrean, cek persyaratan, dan survei kepuasan.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-500">
                Mulai →
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="group relative overflow-hidden rounded-[2rem] border-2 border-accent-100 bg-white p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-accent-500 hover:shadow-2xl"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-accent-200" />
            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-400 text-brand-900 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <FontAwesomeIcon icon={faUsers} className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-brand-900">Staff</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Dashboard loket: panggil, layani, recall, dan skip antrian.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-600">
                Buka →
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="group relative overflow-hidden rounded-[2rem] border-2 border-blue-100 bg-white p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-serdang-blue hover:shadow-2xl"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-blue-200" />
            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-serdang-blue text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                <FontAwesomeIcon icon={faGear} className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-serdang-blue">Admin</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                CMS persyaratan, reset antrean, dan laporan statistik.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-serdang-blue">
                Kelola →
              </span>
            </div>
          </Link>

          <Link
            href="/display"
            className="group relative overflow-hidden rounded-[2rem] border-2 border-emerald-100 bg-white p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:shadow-2xl"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-200" />
            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <FontAwesomeIcon icon={faBullhorn} className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3 group-hover:text-emerald-700">Display</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Layar monitor antrean real-time dengan pengumuman suara panggilan loket.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                Tampilkan →
              </span>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
