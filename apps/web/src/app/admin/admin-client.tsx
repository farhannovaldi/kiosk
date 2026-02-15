"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { 
  faFileLines, 
  faTrash, 
  faPencil,
  faChartColumn,
  faArrowsRotate,
  faPlus,
  faCircleCheck,
  faCircleXmark,
  faListCheck,
  faBuilding
} from "@fortawesome/free-solid-svg-icons";

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

type Counter = {
  id: number;
  name: string;
  assigned_services: number[] | null;
  is_active: boolean;
};

type Requirement = {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
};

type QueueReport = {
  period: string;
  date: string;
  total_visitors: number;
  skipped: number;
  avg_wait_minutes: number | null;
};

type SurveyReport = {
  rating: number;
  total: number;
};

const CKEditorComponent = CKEditor as unknown as React.ComponentType<any>;
const ClassicEditorBuild = ClassicEditor as unknown as any;

export default function AdminClient() {
  const adminSections = [
    { id: "services", label: "Layanan" },
    { id: "counters", label: "Loket" },
    { id: "configuration", label: "Konfigurasi" },
    { id: "requirements", label: "Persyaratan" },
    { id: "reset", label: "Reset" },
    { id: "reports", label: "Laporan" },
  ] as const;

  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [serviceCode, setServiceCode] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<"create" | "edit">("create");
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [counterName, setCounterName] = useState("");
  const [isCounterEditModalOpen, setIsCounterEditModalOpen] = useState(false);
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);
  const [counterEditName, setCounterEditName] = useState("");
  const [deletingCounter, setDeletingCounter] = useState<Counter | null>(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [requirementModalMode, setRequirementModalMode] = useState<"create" | "edit">("create");
  const [editingRequirementId, setEditingRequirementId] = useState<number | null>(null);
  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementContent, setRequirementContent] = useState("");
  const [deletingRequirement, setDeletingRequirement] = useState<Requirement | null>(null);
  const [detailRequirement, setDetailRequirement] = useState<Requirement | null>(null);
  const [queueReport, setQueueReport] = useState<QueueReport | null>(null);
  const [surveyReport, setSurveyReport] = useState<SurveyReport[]>([]);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [activeSection, setActiveSection] = useState<(typeof adminSections)[number]["id"]>("services");
  const [exportingReport, setExportingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serviceData, counterData, requirementData] = await Promise.all([
          apiFetch("/services?include_inactive=1"),
          apiFetch("/counters"),
          apiFetch("/requirements?include_inactive=1"),
        ]);
        setServices(serviceData as Service[]);
        setCounters(counterData as Counter[]);
        setRequirements(requirementData as Requirement[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [queueData, surveyData] = await Promise.all([
          apiFetch(`/reports/queues?period=${reportPeriod}&date=${reportDate}`),
          apiFetch("/reports/surveys"),
        ]);
        setQueueReport(queueData as QueueReport);
        setSurveyReport(surveyData as SurveyReport[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
      }
    };

    loadReports();
  }, [reportPeriod, reportDate]);

  useEffect(() => {
    const observers = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length === 0) return;

        const visibleId = visibleEntries[0].target.id.replace("admin-", "") as (typeof adminSections)[number]["id"];
        setActiveSection((current) => (current === visibleId ? current : visibleId));
      },
      {
        root: null,
        rootMargin: "-140px 0px -45% 0px",
        threshold: [0.15, 0.35, 0.6],
      }
    );

    adminSections.forEach((section) => {
      const element = document.getElementById(`admin-${section.id}`);
      if (element) observers.observe(element);
    });

    return () => observers.disconnect();
  }, []);

  const scrollToSection = (sectionId: (typeof adminSections)[number]["id"]) => {
    setActiveSection(sectionId);
    const target = document.getElementById(`admin-${sectionId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const adminSubNav = (
    <nav className="w-full">
      <div className="flex gap-2 overflow-x-auto">
        {adminSections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  const resetQueues = async () => {
    if (!window.confirm("Reset antrean hari ini?")) return;

    try {
      setError(null);
      const result = (await apiFetch("/admin/queues/reset", {
        method: "POST",
      })) as { deleted: number };
      setResetMessage(`Berhasil reset ${result.deleted} antrean hari ini.`);
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset antrean.");
    }
  };

  const exportReportExcel = async () => {
    try {
      setError(null);
      setExportingReport(true);

      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
      const response = await fetch(
        `${apiBase}/reports/export-excel?period=${encodeURIComponent(reportPeriod)}&date=${encodeURIComponent(reportDate)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengekspor laporan Excel.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const matchedFileName = contentDisposition.match(/filename="?([^\"]+)"?/i)?.[1];
      const fileName = matchedFileName || `laporan-antrian-${reportPeriod}-${reportDate}.xlsx`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengekspor laporan.");
    } finally {
      setExportingReport(false);
    }
  };

  const closeRequirementModal = () => {
    setIsRequirementModalOpen(false);
    setRequirementModalMode("create");
    setEditingRequirementId(null);
    setRequirementTitle("");
    setRequirementContent("");
  };

  const openCreateRequirementModal = () => {
    setRequirementModalMode("create");
    setEditingRequirementId(null);
    setRequirementTitle("");
    setRequirementContent("");
    setIsRequirementModalOpen(true);
  };

  const openEditRequirementModal = (requirement: Requirement) => {
    setRequirementModalMode("edit");
    setEditingRequirementId(requirement.id);
    setRequirementTitle(requirement.title);
    setRequirementContent(requirement.content);
    setIsRequirementModalOpen(true);
  };

  const getPlainEditorText = (html: string) =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeRequirementHtml = (html: string) => {
    const trimmed = html.trim();
    if (!trimmed) return trimmed;

    if (/<(ol|ul)\b/i.test(trimmed)) {
      return trimmed;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");

    const blockItems = Array.from(doc.body.querySelectorAll("p, li"))
      .map((item) => item.innerHTML.replace(/&nbsp;/g, " ").trim())
      .filter(Boolean);

    let items = blockItems;

    if (items.length === 0) {
      const plainText = (doc.body.textContent || "").replace(/\r/g, "").trim();
      items = plainText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }

    if (items.length <= 1) {
      return trimmed;
    }

    return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
  };

  const submitRequirementModal = async () => {
    const normalizedContent = normalizeRequirementHtml(requirementContent);

    if (!requirementTitle.trim() || !getPlainEditorText(normalizedContent)) {
      setError("Judul dan isi persyaratan wajib diisi.");
      return;
    }

    try {
      setError(null);
      if (requirementModalMode === "create") {
        const requirement = (await apiFetch("/requirements", {
          method: "POST",
          json: {
            title: requirementTitle.trim(),
            content: normalizedContent,
            is_active: true,
          },
        })) as Requirement;
        setRequirements((prev) => [requirement, ...prev]);
      } else if (editingRequirementId) {
        const updated = (await apiFetch(`/requirements/${editingRequirementId}`, {
          method: "PATCH",
          json: {
            title: requirementTitle.trim(),
            content: normalizedContent,
          },
        })) as Requirement;
        setRequirements((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      }

      closeRequirementModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : requirementModalMode === "create"
          ? "Gagal menambah persyaratan."
          : "Gagal edit persyaratan."
      );
    }
  };

  const toggleRequirement = async (requirement: Requirement) => {
    try {
      setError(null);
      const updated = (await apiFetch(`/requirements/${requirement.id}`, {
        method: "PATCH",
        json: { is_active: !requirement.is_active },
      })) as Requirement;
      setRequirements((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update persyaratan.");
    }
  };

  const confirmDeleteRequirement = async () => {
    if (!deletingRequirement) return;

    try {
      setError(null);
      await apiFetch(`/requirements/${deletingRequirement.id}`, { method: "DELETE" });
      setRequirements((prev) =>
        prev.filter((item) => item.id !== deletingRequirement.id)
      );
      setDeletingRequirement(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus persyaratan.");
    }
  };

  const toggleCounterService = async (counter: Counter, serviceId: number) => {
    const assigned = counter.assigned_services ?? [];
    const nextAssigned = assigned.includes(serviceId)
      ? assigned.filter((id) => id !== serviceId)
      : [...assigned, serviceId];

    try {
      setError(null);
      const updated = (await apiFetch(`/counters/${counter.id}`, {
        method: "PATCH",
        json: { assigned_services: nextAssigned },
      })) as Counter;
      setCounters((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update loket.");
    }
  };

  // Service CRUD
  const closeServiceModal = () => {
    setIsServiceModalOpen(false);
    setServiceCode("");
    setServiceName("");
    setServiceDescription("");
    setEditingServiceId(null);
  };

  const openCreateServiceModal = () => {
    setServiceModalMode("create");
    setEditingServiceId(null);
    setServiceCode("");
    setServiceName("");
    setServiceDescription("");
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (service: Service) => {
    setServiceModalMode("edit");
    setEditingServiceId(service.id);
    setServiceCode(service.code);
    setServiceName(service.name);
    setServiceDescription(service.description ?? "");
    setIsServiceModalOpen(true);
  };

  const submitServiceModal = async () => {
    if (!serviceCode.trim() || !serviceName.trim()) {
      setError("Kode dan nama layanan wajib diisi.");
      return;
    }

    const payload = {
      code: serviceCode.trim().toUpperCase(),
      name: serviceName.trim(),
      description: serviceDescription.trim() || null,
    };

    try {
      setError(null);
      if (serviceModalMode === "create") {
        const service = (await apiFetch("/services", {
          method: "POST",
          json: {
            ...payload,
            is_active: true,
          },
        })) as Service;
        setServices((prev) => [...prev, service]);
      } else if (editingServiceId) {
        const updated = (await apiFetch(`/services/${editingServiceId}`, {
          method: "PATCH",
          json: payload,
        })) as Service;
        setServices((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      }

      closeServiceModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : serviceModalMode === "create"
          ? "Gagal menambah layanan."
          : "Gagal edit layanan."
      );
    }
  };

  const toggleService = async (service: Service) => {
    try {
      setError(null);
      const updated = (await apiFetch(`/services/${service.id}`, {
        method: "PATCH",
        json: { is_active: !service.is_active },
      })) as Service;
      setServices((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update layanan.");
    }
  };

  const confirmDeleteService = async () => {
    if (!deletingService) return;

    try {
      setError(null);
      await apiFetch(`/services/${deletingService.id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((item) => item.id !== deletingService.id));
      setDeletingService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus layanan.");
    }
  };

  // Counter CRUD
  const createCounter = async () => {
    if (!counterName.trim()) {
      setError("Nama loket wajib diisi.");
      return;
    }

    try {
      setError(null);
      const counter = (await apiFetch("/counters", {
        method: "POST",
        json: { 
          name: counterName.trim(), 
          assigned_services: [],
          is_active: true 
        },
      })) as Counter;
      setCounters((prev) => [...prev, counter]);
      setCounterName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah loket.");
    }
  };

  const toggleCounter = async (counter: Counter) => {
    try {
      setError(null);
      const updated = (await apiFetch(`/counters/${counter.id}`, {
        method: "PATCH",
        json: { is_active: !counter.is_active },
      })) as Counter;
      setCounters((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update loket.");
    }
  };

  const openEditCounterModal = (counter: Counter) => {
    setEditingCounterId(counter.id);
    setCounterEditName(counter.name);
    setIsCounterEditModalOpen(true);
  };

  const closeEditCounterModal = () => {
    setIsCounterEditModalOpen(false);
    setEditingCounterId(null);
    setCounterEditName("");
  };

  const submitEditCounterModal = async () => {
    if (!editingCounterId) return;

    if (!counterEditName.trim()) {
      setError("Nama loket wajib diisi.");
      return;
    }

    try {
      setError(null);
      const updated = (await apiFetch(`/counters/${editingCounterId}`, {
        method: "PATCH",
        json: { name: counterEditName.trim() },
      })) as Counter;
      setCounters((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      closeEditCounterModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal edit loket.");
    }
  };

  const confirmDeleteCounter = async () => {
    if (!deletingCounter) return;

    try {
      setError(null);
      await apiFetch(`/counters/${deletingCounter.id}`, { method: "DELETE" });
      setCounters((prev) => prev.filter((item) => item.id !== deletingCounter.id));
      setDeletingCounter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus loket.");
    }
  };

  const getServiceName = (id: number) =>
    services.find((service) => service.id === id)?.name || "-";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header subtitle="Panel Administrasi" showUser subNav={adminSubNav} />

      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-50 border-l-4 border-red-500 p-6 text-red-700 flex items-start gap-4 shadow-md">
            <FontAwesomeIcon icon={faCircleXmark} className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">Terjadi Kesalahan</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Services Management */}
        <section id="admin-services" className="scroll-mt-40 rounded-[2rem] border-2 border-blue-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faListCheck} className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-black text-gray-800">Kelola Layanan</h2>
          </div>

          <button
            type="button"
            onClick={openCreateServiceModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            Tambah Layanan
          </button>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-lg">
                        {service.code}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                    </div>
                    {service.description ? (
                      <p className="mb-2 text-sm text-gray-600">{service.description}</p>
                    ) : (
                      <p className="mb-2 text-sm italic text-gray-400">Tidak ada deskripsi</p>
                    )}
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {service.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleService(service)}
                    className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-500 hover:text-white"
                  >
                    {service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditServiceModal(service)}
                    className="rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:bg-amber-500 hover:text-white flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingService(service)}
                    className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-center text-gray-400 py-8 italic col-span-2">Belum ada layanan.</p>
            )}
          </div>
        </section>

        {/* Counters Management */}
        <section id="admin-counters" className="scroll-mt-40 rounded-[2rem] border-2 border-purple-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faBuilding} className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-black text-gray-800">Kelola Loket</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Nama Loket</span>
              <input
                value={counterName}
                onChange={(event) => setCounterName(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Contoh: Loket 1"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={createCounter}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            Tambah Loket
          </button>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {counters.map((counter) => (
              <div
                key={counter.id}
                className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{counter.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${counter.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {counter.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCounter(counter)}
                    className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-500 hover:text-white"
                  >
                    {counter.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCounterModal(counter)}
                    className="rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:bg-amber-500 hover:text-white flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCounter(counter)}
                    className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
            {counters.length === 0 && (
              <p className="text-center text-gray-400 py-8 italic col-span-2">Belum ada loket.</p>
            )}
          </div>
        </section>

        {/* Counter Configuration */}
        <section id="admin-configuration" className="scroll-mt-40 rounded-[2rem] border-2 border-brand-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faChartColumn} className="h-8 w-8 text-brand-600" />
            <h2 className="text-3xl font-black text-gray-800">Konfigurasi Loket</h2>
          </div>
          
          <div className="grid gap-6">
            {counters.map((counter) => (
              <div
                key={counter.id}
                className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{counter.name}</h3>
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold ${counter.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {counter.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Layanan Ditugaskan:
                </p>
                <ul className="mb-6 space-y-2">
                  {counter.assigned_services?.length ? (
                    counter.assigned_services.map((id) => (
                      <li key={id} className="flex items-center gap-2 text-gray-700">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 text-brand-500" />
                        <span className="font-medium">{getServiceName(id)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 italic">Belum ada layanan.</li>
                  )}
                </ul>

                <div className="grid gap-3 md:grid-cols-2">
                  {services.filter(s => s.is_active).map((service) => {
                    const isAssigned = counter.assigned_services?.includes(service.id) || false;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleCounterService(counter, service.id)}
                        className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 transition-all hover:scale-102 ${
                          isAssigned
                            ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-green-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-sm ${
                            isAssigned ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {service.code}
                          </span>
                          <span className={`font-semibold ${
                            isAssigned ? 'text-brand-800' : 'text-gray-700'
                          }`}>
                            {service.name}
                          </span>
                        </div>
                        
                        {/* Toggle Switch */}
                        <div className="relative">
                          <div className={`w-12 h-6 rounded-full transition-all ${
                            isAssigned ? 'bg-brand-500' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                              isAssigned ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Requirements Management */}
        <section id="admin-requirements" className="scroll-mt-40 rounded-[2rem] border-2 border-accent-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faFileLines} className="h-8 w-8 text-accent-600" />
            <h2 className="text-3xl font-black text-gray-800">Persyaratan Layanan</h2>
          </div>
          
          <button
            type="button"
            onClick={openCreateRequirementModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            Tambah Persyaratan
          </button>

          <div className="mt-8 space-y-4">
            {requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{requirement.title}</h3>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${requirement.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {requirement.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailRequirement(requirement)}
                      className="rounded-lg border-2 border-purple-500 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition-all hover:bg-purple-500 hover:text-white"
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRequirement(requirement)}
                      className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-500 hover:text-white"
                    >
                      {requirement.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditRequirementModal(requirement)}
                      className="rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:bg-amber-500 hover:text-white flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRequirement(requirement)}
                      className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {requirements.length === 0 && (
              <p className="text-center text-gray-400 py-8 italic">Belum ada persyaratan.</p>
            )}
          </div>
        </section>

        {/* Reset Queue */}
        <section id="admin-reset" className="scroll-mt-40 rounded-[2rem] border-2 border-red-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faArrowsRotate} className="h-8 w-8 text-red-600" />
            <h2 className="text-3xl font-black text-gray-800">Reset Antrean Hari Ini</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Gunakan tombol ini jika terjadi kesalahan fatal pada nomor antrean. Tindakan ini tidak dapat dibatalkan.
          </p>
          <button
            type="button"
            onClick={resetQueues}
            className="rounded-xl border-2 border-red-500 bg-red-50 px-6 py-3 font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white"
          >
            Reset Antrean Hari Ini
          </button>
          {resetMessage && (
            <div className="mt-4 rounded-lg bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
              <FontAwesomeIcon icon={faCircleCheck} className="inline h-5 w-5 mr-2" />
              {resetMessage}
            </div>
          )}
        </section>

        {/* Reports */}
        <section id="admin-reports" className="scroll-mt-40 rounded-[2rem] border-2 border-blue-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FontAwesomeIcon icon={faChartColumn} className="h-8 w-8 text-serdang-blue" />
            <h2 className="text-3xl font-black text-gray-800">Laporan Statistik</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Periode</span>
              <select
                value={reportPeriod}
                onChange={(event) => setReportPeriod(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-serdang-blue focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Tanggal</span>
              <input
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-serdang-blue focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="mb-8 flex justify-end">
            <button
              type="button"
              onClick={exportReportExcel}
              disabled={exportingReport}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingReport ? "Mengekspor..." : "Export Excel"}
            </button>
          </div>

          {queueReport && (
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
                <p className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-2">Total Pengunjung</p>
                <p className="text-5xl font-black text-brand-800">{queueReport.total_visitors}</p>
              </div>
              <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-6">
                <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Total Skipped</p>
                <p className="text-5xl font-black text-red-800">{queueReport.skipped}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Rata-rata Tunggu</p>
                <p className="text-5xl font-black text-blue-800">
                  {queueReport.avg_wait_minutes ?? "-"}
                  {queueReport.avg_wait_minutes && <span className="text-2xl ml-2">min</span>}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Kepuasan Masyarakat</h3>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { rating: 4, label: "Sangat Puas", color: "emerald" },
                { rating: 3, label: "Puas", color: "blue" },
                { rating: 2, label: "Cukup", color: "amber" },
                { rating: 1, label: "Kurang", color: "red" },
              ].map(({ rating, label, color }) => {
                const item = surveyReport.find((report) => report.rating === rating);
                return (
                  <div
                    key={rating}
                    className={`rounded-2xl border-2 border-${color}-200 bg-${color}-50 p-6 text-center`}
                  >
                    <p className={`text-sm font-bold text-${color}-600 uppercase tracking-wider mb-2`}>{label}</p>
                    <p className={`text-4xl font-black text-${color}-800`}>{item?.total ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {isServiceModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeServiceModal}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border-2 border-blue-200 bg-white p-8 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-6 text-2xl font-black text-gray-800">
                {serviceModalMode === "create" ? "Tambah Layanan" : "Edit Layanan"}
              </h3>

              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Kode Layanan</span>
                  <input
                    value={serviceCode}
                    onChange={(event) => setServiceCode(event.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Contoh: A, B, C"
                    maxLength={10}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Nama Layanan</span>
                  <input
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Contoh: Layanan Umum"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Deskripsi</span>
                  <textarea
                    value={serviceDescription}
                    onChange={(event) => setServiceDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Deskripsi singkat layanan"
                  />
                </label>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitServiceModal}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl"
                >
                  {serviceModalMode === "create" ? "Simpan Layanan" : "Update Layanan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isRequirementModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeRequirementModal}
          >
            <div
              className="w-full max-w-3xl rounded-2xl border-2 border-accent-200 bg-white p-8 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-6 text-2xl font-black text-gray-800">
                {requirementModalMode === "create" ? "Tambah Persyaratan" : "Edit Persyaratan"}
              </h3>

              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Judul</span>
                  <input
                    value={requirementTitle}
                    onChange={(event) => setRequirementTitle(event.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
                    placeholder="Contoh: KTP Baru"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Isi Persyaratan</span>
                  <p className="mb-3 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-xs text-accent-800">
                    Hint: Klik tombol numbered list (1,2,3), lalu tekan Enter untuk menambah nomor berikutnya. Jika Anda menulis per baris dengan Enter tanpa list, sistem akan otomatis menyimpan sebagai daftar bernomor.
                  </p>
                  <div className="rounded-xl border-2 border-gray-200 bg-white p-2">
                    <CKEditorComponent
                      editor={ClassicEditorBuild}
                      data={requirementContent}
                      onChange={(_event: unknown, editor: { getData: () => string }) => {
                        setRequirementContent(editor.getData());
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRequirementModal}
                  className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitRequirementModal}
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl"
                >
                  {requirementModalMode === "create" ? "Simpan Persyaratan" : "Update Persyaratan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingRequirement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setDeletingRequirement(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-xl font-black text-gray-800">Hapus Persyaratan</h3>
              <p className="mt-3 text-gray-600">
                Yakin ingin menghapus persyaratan <span className="font-bold text-gray-800">{deletingRequirement.title}</span>?
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingRequirement(null)}
                  className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRequirement}
                  className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2 font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {detailRequirement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setDetailRequirement(null)}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">{detailRequirement.title}</h3>
                  <span className={`mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold ${detailRequirement.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {detailRequirement.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div
                className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: detailRequirement.content }}
              />

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailRequirement(null)}
                  className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingService && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setDeletingService(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-xl font-black text-gray-800">Hapus Layanan</h3>
              <p className="mt-3 text-gray-600">
                Yakin ingin menghapus layanan <span className="font-bold text-gray-800">{deletingService.code} - {deletingService.name}</span>?
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingService(null)}
                  className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteService}
                  className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2 font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {isCounterEditModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeEditCounterModal}
          >
            <div
              className="w-full max-w-xl rounded-2xl border-2 border-purple-200 bg-white p-8 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-6 text-2xl font-black text-gray-800">Edit Loket</h3>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wider">Nama Loket</span>
                <input
                  value={counterEditName}
                  onChange={(event) => setCounterEditName(event.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Contoh: Loket 1"
                />
              </label>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditCounterModal}
                  className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitEditCounterModal}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl"
                >
                  Update Loket
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingCounter && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setDeletingCounter(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-xl font-black text-gray-800">Hapus Loket</h3>
              <p className="mt-3 text-gray-600">
                Yakin ingin menghapus <span className="font-bold text-gray-800">{deletingCounter.name}</span>?
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCounter(null)}
                  className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCounter}
                  className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2 font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
