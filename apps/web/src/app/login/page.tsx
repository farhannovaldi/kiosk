"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getCsrfCookie } from "@/lib/api";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await getCsrfCookie();
      await apiFetch("/login", {
        method: "POST",
        json: { email, password },
      });
      
      // Fetch user data untuk dapat role
      const user = await apiFetch("/user") as { id: number; name: string; email: string; role: string };
      
      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "staff") {
        router.push("/staff");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] shadow-2xl border-2 border-brand-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative h-16 w-14 bg-white rounded-lg p-1 shadow-lg">
                <Image 
                  src="/Logo.png"
                  alt="Logo Serdang Bedagai" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Login Sistem</h1>
            <p className="text-sm text-brand-100">Kabupaten Serdang Bedagai</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-800 text-sm">Login Gagal</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
                    placeholder="Masukkan email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
                    placeholder="Masukkan password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-brand-600 font-semibold transition-colors"
              >
                ← 
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs font-bold text-blue-800 mb-2">Demo Credentials:</p>
              <p className="text-xs text-blue-700">Admin: admin@local.test / password</p>
              <p className="text-xs text-blue-700">Staff: staff@local.test / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
