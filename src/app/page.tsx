"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLoading, setSocialLoading] = useState<"google" | "kakao" | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function signInWithGoogle() {
    setSocialLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithKakao() {
    setSocialLoading("kakao");
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setEmailLoading(false);
      return;
    }
    // full reload so middleware re-reads the session cookie
    window.location.href = "/admin/feed/new";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
      <div className="w-full max-w-sm">
        {/* 브랜드 */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            produck
          </span>
          <p className="mt-1.5 text-sm text-gray-500">로그인하고 글쓰기를 시작하세요</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-3">
          {/* 카카오 */}
          <button
            type="button"
            onClick={signInWithKakao}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <KakaoIcon />
            {socialLoading === "kakao" ? "연결 중..." : "카카오로 계속하기"}
          </button>

          {/* 구글 */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <GoogleIcon />
            {socialLoading === "google" ? "연결 중..." : "Google로 계속하기"}
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* 이메일 */}
          <form onSubmit={signInWithEmail} className="space-y-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
            />

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {emailLoading ? "로그인 중..." : "이메일로 로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.37c0 2.072 1.378 3.893 3.464 4.94l-.883 3.3a.187.187 0 0 0 .287.202l4.028-2.672c.193.017.39.026.604.026 4.142 0 7.5-2.634 7.5-5.87C16.5 4.134 13.142 1.5 9 1.5Z"
        fill="#191919"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
