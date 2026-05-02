"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function StudentLogin() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  // Reset errors on tab change
  useEffect(() => {
    setError("");
    setIsSuccess(false);
  }, [tab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }

      // Artificial delay for premium feel
      setTimeout(() => {
        if (data.role === "staff") router.push("/staff/dashboard");
        else router.push("/student/dashboard");
      }, 800);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      setIsSuccess(true);

      // Success flow: Show success then switch to login
      setTimeout(() => {
        setIsSuccess(false);
        setTab("login");
        setFormData((prev) => ({ ...prev, password: "" }));
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-4 shadow-lg shadow-red-600/20"
              >
                <GraduationCap size={32} className="text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {tab === "login" ? "Welcome Back" : "Join CU-UP"}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {tab === "login"
                  ? "Sign in to your student portal"
                  : "Create your student account"}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8 border border-white/5">
              <button
                onClick={() => setTab("login")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  tab === "login"
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setTab("register")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  tab === "register"
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f172a]/95 backdrop-blur-md rounded-[32px] p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <CheckCircle2 size={64} className="text-green-500 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white">
                    Account Created!
                  </h3>
                  <p className="text-zinc-400 mt-2 text-sm">
                    Welcome to the community. Redirecting to login...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form
              onSubmit={tab === "login" ? handleLogin : handleRegister}
              className="space-y-5"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === "login" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === "login" ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {tab === "register" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 ml-1">
                        Full Name
                      </label>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-red-500/50 transition-all">
                        <User size={18} className="text-zinc-500" />
                        <Input
                          name="name"
                          placeholder="John Doe"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="flex-1 bg-transparent border-0 p-0 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 ml-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-red-500/50 transition-all">
                      <Mail size={18} className="text-zinc-500" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="flex-1 bg-transparent border-0 p-0 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-red-500/50 transition-all">
                        <Lock size={18} className="text-zinc-500" />
                        <Input
                          type={showPass ? "text" : "password"}
                          name="password"
                          placeholder="••••••••"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="flex-1 bg-transparent border-0 p-0 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="text-zinc-500 hover:text-white"
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {tab === "register" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500 ml-1">
                        Department (optional)
                      </label>
                      <Input
                        name="department"
                        placeholder="e.g. CSE"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="bg-white/5 border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 h-11"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-900/30 rounded-xl px-3 py-2 text-xs"
                >
                  <AlertTriangle size={14} className="shrink-0" /> {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>
                      {tab === "login" ? "Sign In" : "Create Account"}
                    </span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </Button>
            </form>
          </div>

          <div className="bg-white/[0.02] py-6 px-8 border-t border-white/5 flex items-center justify-between">
            <Link
              href="/staff/login"
              className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
            >
              Staff Portal →
            </Link>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-8 uppercase tracking-[0.2em] font-bold">
          © 2026 Chandigarh University Community
        </p>
      </motion.div>
    </div>
  );
}
