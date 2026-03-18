"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setUser(data.user);
      router.push("/");
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-16 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {mode === "login" ? "로그인" : "회원가입"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ShadowTube에 오신 것을 환영합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-red-400 transition-colors"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-red-400 transition-colors"
            placeholder="6자 이상"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-red-600 font-medium hover:underline"
        >
          {mode === "login" ? "회원가입" : "로그인"}
        </button>
      </p>
    </div>
  );
}
