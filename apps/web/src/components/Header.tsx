"use client";

import type React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket, faChevronDown } from "@fortawesome/free-solid-svg-icons";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function Header({
  subtitle,
  showTime = false,
  showUser = false,
  subNav,
}: {
  subtitle?: string;
  showTime?: boolean;
  showUser?: boolean;
  subNav?: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showUser) {
      const fetchUser = async () => {
        try {
          const userData = await apiFetch("/user") as User;
          setUser(userData);
        } catch (err) {
          console.error("Failed to fetch user:", err);
        }
      };
      fetchUser();
    }
  }, [showUser]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await apiFetch("/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 shadow-lg backdrop-blur-md">
      <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-accent-400 to-brand-600" />
      <div className="container mx-auto flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-16 flex-shrink-0">
            <Image 
              src="/Logo.png"
              alt="Logo Serdang Bedagai" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tight text-brand-900 md:text-2xl">
              Kabupaten Serdang Bedagai
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-600 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {subNav && (
          <div className="ml-auto mr-2 hidden lg:block">
            {subNav}
          </div>
        )}
        
        {showUser && user ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-3 py-2 transition-all hover:border-brand-400 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
              </div>
              <div className="hidden text-left leading-tight md:block">
                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{user.role}</p>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`h-3 w-3 text-brand-600 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-600">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-700 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                  {loggingOut ? "Keluar..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        ) : showTime ? (
          <div className="hidden md:block">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Jam Operasional</div>
              <div className="text-sm font-bold text-gray-700">Senin - Jumat | 08:00 - 16:00</div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
