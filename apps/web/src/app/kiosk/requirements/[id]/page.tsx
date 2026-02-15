import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

type Requirement = {
  id: number;
  title: string;
  content: string;
};

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function RequirementDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const requirementId = resolvedParams?.id;

  if (!requirementId) {
    notFound();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
  const response = await fetch(`${apiBase}/requirements/${encodeURIComponent(requirementId)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    notFound();
  }
  const requirement = (await response.json()) as Requirement;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-white flex flex-col">
      <Header subtitle="Detail Persyaratan" />
      
      <main className="container mx-auto max-w-4xl flex-1 px-6 py-12">
        <div className="mb-10">
          <Link
            href="/kiosk/requirements"
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-accent-600 shadow-md transition-all hover:shadow-lg hover:bg-accent-50 border border-accent-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Daftar
          </Link>
          <h1 className="text-4xl font-black text-brand-900 mb-3">{requirement.title}</h1>
          <p className="text-lg text-gray-600 font-medium">Daftar persyaratan dokumen yang harus dipenuhi</p>
        </div>

        <div className="rounded-[2rem] border-2 border-accent-200 bg-white p-10 shadow-2xl">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-brand-900 border-b-2 border-brand-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-400 text-xl">
              <FontAwesomeIcon icon={faClipboardList} className="h-5 w-5 text-brand-900" />
            </span>
            Dokumen yang Diperlukan
          </h2>
          {/<[^>]+>/.test(requirement.content) ? (
            <div
              className="max-w-none text-lg leading-relaxed text-gray-700 [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:space-y-2 [&_li]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: requirement.content }}
            />
          ) : (
            <div className="whitespace-pre-line text-lg leading-relaxed text-gray-700">
              {requirement.content}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-blue-50 border-l-4 border-serdang-blue p-6">
          <h3 className="font-bold text-serdang-blue mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="h-5 w-5" />
            Informasi Penting
          </h3>
          <p className="text-gray-700">
            Pastikan semua dokumen telah disiapkan sebelum mengambil nomor antrian. 
            Dokumen yang tidak lengkap dapat menyebabkan proses layanan tertunda.
          </p>
        </div>
      </main>
    </div>
  );
}
