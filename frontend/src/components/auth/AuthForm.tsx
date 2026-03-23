"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Mail, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

interface Props { mode: "login" | "register"; }

function validatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

// ─── Forgot Password Flow ────────────────────────────────────────────────────
type ForgotStep = "email" | "otp" | "newpw" | "done";

function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwChecks = validatePassword(newPw);
  const pwValid = Object.values(pwChecks).every(Boolean);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/50 focus:border-[#C5A021] transition-all placeholder:text-stone-400";

  const handleSendOtp = async () => {
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError("Enter the 6-digit code from your email."); return; }
    // We don't verify OTP separately — just move to next step
    setError("");
    setStep("newpw");
  };

  const handleResetPassword = async () => {
    if (!pwValid) { setError("Password does not meet the requirements."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, new_password: newPw });
      setStep("done");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Reset failed. Check your code and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#C5A021] transition-colors font-medium">
        <ArrowLeft size={15} /> Back to login
      </button>

      {step === "done" ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white">Password Reset!</h3>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Your password has been updated. You can now sign in with your new password.</p>
          <button onClick={onBack} className="w-full py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
            Back to Login
          </button>
        </div>
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            {(["email", "otp", "newpw"] as ForgotStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step === s ? "bg-[#C5A021] text-white" :
                  (["email","otp","newpw"].indexOf(step) > i) ? "bg-emerald-500 text-white" :
                  "bg-stone-100 dark:bg-stone-800 text-stone-400"
                )}>
                  {(["email","otp","newpw"].indexOf(step) > i) ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                {i < 2 && <div className={cn("flex-1 h-0.5 w-8", (["email","otp","newpw"].indexOf(step) > i) ? "bg-emerald-400" : "bg-stone-200 dark:bg-stone-700")} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
              <XCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {step === "email" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Forgot your password?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">Enter your email and we'll send you a reset code.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                    className={inputClass + " pl-10"} placeholder="you@example.com" />
                </div>
              </div>
              <button onClick={handleSendOtp} disabled={loading}
                className="w-full py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />} Send Reset Code
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Check your email</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  We sent a 6-digit code to <span className="font-semibold text-stone-700 dark:text-stone-300">{email}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Reset Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type="text" inputMode="numeric" maxLength={6} value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                    className={inputClass + " pl-10 text-center text-2xl font-bold tracking-[0.5em]"}
                    placeholder="000000" />
                </div>
              </div>
              <button onClick={handleVerifyOtp} disabled={otp.length < 6}
                className="w-full py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors disabled:opacity-60">
                Verify Code
              </button>
              <button onClick={() => { setError(""); handleSendOtp(); }}
                className="w-full text-sm text-stone-500 hover:text-[#C5A021] transition-colors">
                Didn't receive it? Resend code
              </button>
            </div>
          )}

          {step === "newpw" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Set new password</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">Choose a strong password for your account.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className={inputClass + " pr-12"} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPw.length > 0 && (
                  <div className="mt-2 p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl border border-stone-100 dark:border-[#8E6708]/20 space-y-1.5">
                    {[
                      { key: "length", label: "At least 8 characters" },
                      { key: "upper", label: "One uppercase letter" },
                      { key: "lower", label: "One lowercase letter" },
                      { key: "number", label: "One number" },
                      { key: "special", label: "One special character" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        {pwChecks[key as keyof typeof pwChecks]
                          ? <CheckCircle2 size={12} className="text-emerald-500" />
                          : <XCircle size={12} className="text-stone-300 dark:text-stone-600" />}
                        <span className={pwChecks[key as keyof typeof pwChecks] ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Confirm Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className={cn(inputClass, confirmPw && confirmPw !== newPw ? "border-red-400 focus:border-red-400" : "")}
                  placeholder="••••••••" />
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={11} /> Passwords do not match</p>
                )}
              </div>
              <button onClick={handleResetPassword} disabled={loading || !pwValid || newPw !== confirmPw}
                className="w-full py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />} Reset Password
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main AuthForm ────────────────────────────────────────────────────────────
export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const { t } = useAppContext();
  const [form, setForm] = useState({ email: "", password: "", role: "teacher", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwHints, setShowPwHints] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const pwChecks = validatePassword(form.password);
  const pwValid = Object.values(pwChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (mode === "login") {
      if (!form.email || !form.email.includes("@")) { setError("Please enter a valid email address."); return; }
      if (!form.password) { setError("Please enter your password."); return; }
    }

    if (mode === "register") {
      if (!pwValid) { setError("Password does not meet the requirements below."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const params = new URLSearchParams({ username: form.email, password: form.password });
        const { data } = await api.post("/auth/login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        setAuth(data.user, data.profile, data.access_token);
        document.cookie = `access_token=${data.access_token}; path=/`;
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
      } else {
        await api.post("/auth/register", { email: form.email, password: form.password, role: form.role });
        router.push("/login?registered=1");
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : mode === "login" ? "Invalid email or password." : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/50 focus:border-[#C5A021] transition-all placeholder:text-stone-400";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-stone-50 dark:bg-[#0c0a09]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-[#221902] border border-stone-100 dark:border-[#8E6708]/30 shadow-sm mb-4 overflow-hidden">
            <Image src="/logo.png" alt="Astemari" width={48} height={48} className="object-contain p-1" />
          </div>
          <h1 className="text-3xl font-bold text-[#221902] dark:text-white">
            {showForgot ? "Reset Password" : mode === "login" ? t("auth.login") : t("auth.register")}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2">
            {showForgot ? "We'll send a code to your email" : mode === "login" ? t("auth.have_account") : "Join Ethiopia's top teacher network"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#221902]/60 rounded-3xl border border-stone-200 dark:border-[#8E6708]/25 p-8 shadow-sm">
          {showForgot ? (
            <ForgotPasswordFlow onBack={() => setShowForgot(false)} />
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">{t("auth.role")}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["teacher", "school"] as const).map((r) => (
                        <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                          className={cn("py-3 rounded-xl border-2 text-sm font-bold capitalize transition-all",
                            form.role === r ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300")}>
                          {r === "teacher" ? `👨‍🏫 ${t("auth.role.teacher")}` : `🏫 ${t("auth.role.school")}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">{t("auth.email")}</label>
                  <input type="text" inputMode="email" autoComplete="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass} placeholder="you@example.com" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">{t("auth.password")}</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setShowForgot(true)}
                        className="text-xs text-[#C5A021] hover:underline font-semibold">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={() => mode === "register" && setShowPwHints(true)}
                      className={inputClass + " pr-12"} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {mode === "register" && showPwHints && form.password.length > 0 && (
                    <div className="mt-3 p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl border border-stone-100 dark:border-[#8E6708]/20 space-y-1.5">
                      {[
                        { key: "length", label: "At least 8 characters" },
                        { key: "upper", label: "One uppercase letter (A-Z)" },
                        { key: "lower", label: "One lowercase letter (a-z)" },
                        { key: "number", label: "One number (0-9)" },
                        { key: "special", label: "One special character (!@#...)" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          {pwChecks[key as keyof typeof pwChecks]
                            ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                            : <XCircle size={13} className="text-stone-300 dark:text-stone-600 flex-shrink-0" />}
                          <span className={pwChecks[key as keyof typeof pwChecks] ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">{t("auth.confirm_password")}</label>
                    <input type="password" autoComplete="new-password" value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className={cn(inputClass, form.confirmPassword && form.confirmPassword !== form.password ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "")}
                      placeholder="••••••••" />
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>
                    )}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#a8871a] transition-all shadow-lg shadow-amber-200 dark:shadow-amber-900/20 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading
                    ? (mode === "login" ? t("auth.signing_in") : t("auth.creating"))
                    : (mode === "login" ? t("auth.login") : t("auth.register"))
                  }
                </button>
              </form>

              <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
                {mode === "login" ? t("auth.no_account") : t("auth.have_account")}{" "}
                <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-[#C5A021] hover:underline">
                  {mode === "login" ? t("auth.register") : t("auth.login")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
