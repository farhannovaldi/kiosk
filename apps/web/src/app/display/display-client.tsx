"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faVolumeHigh,
    faVolumeXmark,
    faRotate,
    faClock,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";

type Service = {
    id: number;
    code: string;
    name: string;
};

type CurrentQueue = {
    id: number;
    ticket_code: string;
    status: "called" | "serving" | string;
    called_at: string | null;
    recall_count: number;
    service: Service;
};

type DisplayCounter = {
    counter: {
        id: number;
        name: string;
    };
    current: CurrentQueue | null;
    waiting_count: number;
};

type DisplayBoardResponse = {
    date: string;
    updated_at: string;
    counters: DisplayCounter[];
};

const REFRESH_MS = 1000;

type Announcement = {
    key: string;
    text: string;
};

function buildAnnouncementText(item: DisplayCounter) {
    if (!item.current) return "";
    return `Nomor antrean ${item.current.ticket_code}, silakan menuju ${item.counter.name}.`;
}

export default function DisplayClient() {
    const [board, setBoard] = useState<DisplayBoardResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [isDisplayMode, setIsDisplayMode] = useState(false);
    const [speakingKey, setSpeakingKey] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());

    const lastAnnouncedRef = useRef<Map<number, string>>(new Map());
    const speechQueueRef = useRef<Announcement[]>([]);
    const isSpeakingRef = useRef(false);

    const counters = board?.counters ?? [];

    const getPreferredVoice = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        return (
            voices.find((voice) => voice.lang.toLowerCase() === "id-id") ||
            voices.find((voice) => voice.lang.toLowerCase().startsWith("id")) ||
            voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
            null
        );
    };

    const speakNextQueue = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        if (!isAudioEnabled || isSpeakingRef.current) return;

        const next = speechQueueRef.current.shift();
        if (!next) return;

        const utterance = new SpeechSynthesisUtterance(next.text);
        const selectedVoice = getPreferredVoice();

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = "id-ID";
        }

        utterance.rate = 0.92;
        utterance.pitch = 1;

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            setSpeakingKey(next.key);
        };
        utterance.onend = () => {
            isSpeakingRef.current = false;
            setSpeakingKey((current) => (current === next.key ? null : current));
            speakNextQueue();
        };
        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setSpeakingKey((current) => (current === next.key ? null : current));
            setAudioError("Gagal memutar suara. Coba aktifkan ulang audio.");
            speakNextQueue();
        };

        window.speechSynthesis.speak(utterance);
    };

    const enqueueSpeech = (text: string, key: string) => {
        if (!text) return;
        speechQueueRef.current.push({ text, key });
        speakNextQueue();
    };

    const callSpeech = (text: string, announceKey: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
        enqueueSpeech(text, announceKey);
    };

    const loadBoard = async () => {
        try {
            const data = (await apiFetch("/display-board")) as DisplayBoardResponse;
            setBoard(data);
            setError(null);
            setAudioError(null);

            if (!isAudioEnabled) return;

            data.counters.forEach((item) => {
                if (!item.current || !["called", "serving"].includes(item.current.status)) return;

                const announceKey = `${item.current.id}:${item.current.called_at ?? ""}:${item.current.recall_count}`;
                const previousKey = lastAnnouncedRef.current.get(item.counter.id);

                if (announceKey === previousKey) return;

                lastAnnouncedRef.current.set(item.counter.id, announceKey);
                callSpeech(buildAnnouncementText(item), announceKey);
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal memuat display antrean.");
        }
    };

    const enableAudio = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            setAudioError("Browser ini tidak mendukung suara otomatis.");
            return;
        }

        setAudioError(null);
        setIsAudioEnabled(true);
        window.speechSynthesis.getVoices();

        const unlockUtterance = new SpeechSynthesisUtterance("Suara display aktif.");
        const selectedVoice = getPreferredVoice();
        if (selectedVoice) {
            unlockUtterance.voice = selectedVoice;
            unlockUtterance.lang = selectedVoice.lang;
        } else {
            unlockUtterance.lang = "id-ID";
        }
        unlockUtterance.rate = 1;
        window.speechSynthesis.speak(unlockUtterance);
    };

    const requestFullscreen = async () => {
        if (typeof document === "undefined") return;
        if (document.fullscreenElement) return;
        try {
            await document.documentElement.requestFullscreen();
            setIsDisplayMode(true);
        } catch {
            setAudioError("Fullscreen harus diaktifkan lewat interaksi tombol.");
        }
    };

    const exitFullscreen = async () => {
        if (typeof document === "undefined" || !document.fullscreenElement) return;
        await document.exitFullscreen();
        setIsDisplayMode(false);
    };

    const activateDisplayMode = async () => {
        enableAudio();
        if (typeof document !== "undefined" && document.fullscreenElement) {
            await exitFullscreen();
            return;
        }
        await requestFullscreen();
    };

    useEffect(() => {
        loadBoard();
        const interval = setInterval(loadBoard, REFRESH_MS);
        return () => clearInterval(interval);
    }, [isAudioEnabled]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const handleFullscreenChange = () => {
            setIsDisplayMode(Boolean(document.fullscreenElement));
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const handleVoices = () => window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
            return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
        }
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#05261d] via-[#0b3b2d] to-[#031b15] text-white">
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-cyan-300/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

            <header className="relative border-b border-emerald-200/20 bg-black/25 backdrop-blur-xl">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-300/90 via-cyan-300/90 to-amber-300/90" />
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-16">
                            <Image src="/Logo.png" alt="Logo Serdang Bedagai" fill className="object-contain" priority />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100">Display Antrean</p>
                            <h1 className="text-2xl font-black tracking-tight text-white">Kabupaten Serdang Bedagai</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={loadBoard}
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/40 bg-cyan-400/20 px-4 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-400/30"
                        >
                            <FontAwesomeIcon icon={faRotate} className="h-4 w-4" />
                            Refresh
                        </button>
                        {isAudioEnabled ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAudioEnabled(false);
                                    speechQueueRef.current = [];
                                    isSpeakingRef.current = false;
                                    setSpeakingKey(null);
                                    if (typeof window !== "undefined" && window.speechSynthesis) {
                                        window.speechSynthesis.cancel();
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/25 px-4 py-2 text-sm font-bold text-rose-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-500/35"
                            >
                                <FontAwesomeIcon icon={faVolumeXmark} className="h-4 w-4" />
                                Suara Off
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={enableAudio}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-400/25 px-4 py-2 text-sm font-bold text-emerald-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/35"
                            >
                                <FontAwesomeIcon icon={faVolumeHigh} className="h-4 w-4" />
                                Aktifkan Suara
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={activateDisplayMode}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-200/45 bg-amber-400/25 px-4 py-2 text-sm font-bold text-amber-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-400/35"
                        >
                            {isDisplayMode ? "Keluar Mode Display" : "Mode Display"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto w-full max-w-7xl px-6 py-8">
                <section className="mb-8 grid gap-4 md:grid-cols-1">
                    <div className="rounded-2xl border border-emerald-200/30 bg-gradient-to-r from-emerald-400/20 to-cyan-300/15 p-5 shadow-xl backdrop-blur-md">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-emerald-200/90">Waktu Saat Ini</p>
                        <p className="text-3xl font-black leading-none">{now.toLocaleTimeString("id-ID")}</p>
                        <p className="mt-2 text-xs text-white/80">{now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                </section>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-300/50 bg-red-500/20 p-4 text-red-50">{error}</div>
                )}

                {audioError && (
                    <div className="mb-6 rounded-2xl border border-yellow-300/50 bg-yellow-500/20 p-4 text-yellow-50">{audioError}</div>
                )}

                {speakingKey && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100">
                        <FontAwesomeIcon icon={faVolumeHigh} className="h-4 w-4" />
                        Sedang mengumumkan panggilan antrean...
                    </div>
                )}

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {counters.map((item) => {
                        const current = item.current;
                        const isServing = current?.status === "serving";
                        const isCalled = current?.status === "called";

                        return (
                            <article
                                key={item.counter.id}
                                className={`relative overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${isServing
                                        ? "border-emerald-200/70 bg-gradient-to-br from-emerald-400/35 to-teal-400/25 ring-1 ring-emerald-200/40"
                                        : isCalled
                                            ? "border-amber-200/70 bg-gradient-to-br from-amber-400/35 to-orange-400/25 ring-1 ring-amber-200/40"
                                            : "border-white/25 bg-gradient-to-br from-white/[0.12] to-emerald-900/20"
                                    }`}
                            >
                                {(isServing || isCalled) && (
                                    <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                )}

                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-black tracking-tight">{item.counter.name}</h2>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${isServing
                                            ? "border-emerald-200/60 bg-emerald-300/20 text-emerald-50"
                                            : isCalled
                                                ? "border-amber-200/60 bg-amber-300/20 text-amber-50"
                                                : "border-white/30 bg-black/20 text-white/90"
                                        }`}>
                                        {current ? (isServing ? "Sedang Dilayani" : "Dipanggil") : "Siaga"}
                                    </span>
                                </div>

                                <div className="rounded-2xl border border-white/25 bg-gradient-to-br from-black/30 to-black/15 p-5 text-center">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Nomor Saat Ini</p>
                                    <p className="text-6xl font-black tracking-tight drop-shadow-lg">{current?.ticket_code ?? "-"}</p>
                                    <p className="mt-2 text-sm text-white/85">{current ? `Menuju ${item.counter.name}` : "Belum ada panggilan"}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/25 bg-black/25 px-4 py-3">
                                    <div className="inline-flex items-center gap-2 text-sm text-white/90">
                                        <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
                                        Menunggu
                                    </div>
                                    <span className="text-2xl font-black">{item.waiting_count}</span>
                                </div>

                                {current?.called_at && (
                                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/70">
                                        <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                                        Dipanggil: {new Date(current.called_at).toLocaleTimeString("id-ID")}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>

                {!counters.length && (
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-white/80">
                        Belum ada loket aktif untuk ditampilkan.
                    </div>
                )}
            </main>
        </div>
    );
}
