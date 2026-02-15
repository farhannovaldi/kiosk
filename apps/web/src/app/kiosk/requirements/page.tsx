import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";

type Requirement = {
  id: number;
  title: string;
  content: string;
};

export default async function RequirementsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
  const response = await fetch(`${apiBase}/requirements`, { cache: "no-store" });
  const requirements = response.ok ? ((await response.json()) as Requirement[]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-white flex flex-col">
      <Header subtitle="Informasi Persyaratan" />
      
      <main className="container mx-auto max-w-6xl flex-1 px-6 py-12">
        <div className="mb-10">
          <Link
            href="/kiosk"
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-accent-600 shadow-md transition-all hover:shadow-lg hover:bg-accent-50 border border-accent-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </Link>
          <h1 className="text-4xl font-black text-brand-900 mb-3">Persyaratan Layanan</h1>
          <p className="text-lg text-gray-700 font-medium">Pilih layanan untuk melihat daftar persyaratan dokumen.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {requirements.length ? (
            requirements.map((requirement) => (
              <Link
                key={requirement.id}
                href={`/kiosk/requirements/${requirement.id}`}
                className="group relative overflow-hidden rounded-[2rem] border-2 border-accent-100 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-accent-500 hover:shadow-2xl flex flex-col min-h-[200px]"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-100 transition-all duration-500 group-hover:scale-150 group-hover:bg-accent-200" />
                
                <div className="relative z-10 flex-1">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-400 text-2xl text-brand-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FontAwesomeIcon icon={faClipboardList} className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-brand-900 mb-3">{requirement.title}</h2>
                  <p className="text-gray-500 group-hover:text-gray-700 text-sm">
                    Ketuk untuk melihat daftar lengkap dokumen yang diperlukan.
                  </p>
                </div>
                
                <div className="relative z-10 mt-6 flex items-center justify-end">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-600 transition-all group-hover:bg-accent-500 group-hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
              <FontAwesomeIcon icon={faClipboardList} className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Belum ada data persyaratan.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
