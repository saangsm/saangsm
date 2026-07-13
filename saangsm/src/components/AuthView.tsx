import React, { useState } from "react";
import { Cpu, Eye, EyeOff, UserPlus, LogIn, AlertTriangle, Key } from "lucide-react";
import { User } from "../types";

interface AuthViewProps {
  initialMode?: "login" | "register";
  onAuthSuccess: (user: User, token: string) => void;
  onNavigate: (viewName: string, params?: any) => void;
  redirectParams?: { redirectTo: string; redirectParams?: any } | null;
}

export default function AuthView({ initialMode = "login", onAuthSuccess, onNavigate, redirectParams = null }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");

  const handleToggleMode = () => {
    setError("");
    setMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body: Record<string, any> = { email, password };

    if (mode === "register") {
      if (!name || !phone) {
        setError("Tafadhali jaza nyanja zote za usajili.");
        setSubmitting(false);
        return;
      }
      body.name = name;
      body.phone = phone;
      if (adminSecret.trim() !== "") {
        body.adminSecret = adminSecret;
      }
    }

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Mtatizo yamejitokeza wakati wa kufungua akaunti.");
          });
        }
        return res.json();
      })
      .then((data) => {
        setSubmitting(false);
        if (data.token && data.user) {
          // Save token to localStorage
          localStorage.setItem("saangsm_token", data.token);
          
          // Trigger success callback
          onAuthSuccess(data.user, data.token);

          // Handle redirection
          if (redirectParams && redirectParams.redirectTo) {
            onNavigate(redirectParams.redirectTo, redirectParams.redirectParams);
          } else {
            // Default: go to home
            onNavigate(data.user.role === "admin" ? "admin-dashboard" : "home");
          }
        }
      })
      .catch((err) => {
        setSubmitting(false);
        setError(err.message || "Hitilafu kwenye mawasiliano ya server.");
      });
  };

  return (
    <div id="auth-view-container" className="mx-auto max-w-md px-4 py-16">
      {/* Container card */}
      <div className="border border-gray-800 bg-gray-950 p-6 sm:p-8 rounded-lg space-y-6 relative overflow-hidden">
        {/* Hardware trace styling */}
        <div className="absolute top-0 right-0 h-16 w-16 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:10px_10px]" />

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Cpu className="h-6 w-6 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="font-sans text-xl font-bold uppercase tracking-wider text-white">
            SaanGSM <span className="text-amber-500">Marketplace</span>
          </h1>
          <p className="text-xs text-gray-500">
            {mode === "login"
              ? "Ingia ili uweze kuagiza na kufuatilia huduma zako za GSM"
              : "Sajili akaunti mpya ya mafundi wa simu kuanza kutumia huduma"}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-400">Jina Kamili</label>
                <input
                  type="text"
                  id="reg-name"
                  placeholder="Mfano: Peter Msuku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-800 bg-black py-2 px-3 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-400">Namba ya Simu (Kwa Malipo)</label>
                <input
                  type="text"
                  id="reg-phone"
                  placeholder="Mfano: 0757224250"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-800 bg-black py-2 px-3 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition font-mono"
                  required
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400">Barua Pepe (Email)</label>
            <input
              type="email"
              id="auth-email"
              placeholder="Mfano: fundi@saangsm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-800 bg-black py-2 px-3 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1 relative">
            <label className="block text-xs font-semibold text-gray-400">Neno la Siri (Password)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="auth-password"
                placeholder="Ingiza password yako"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-800 bg-black py-2 pl-3 pr-10 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Optional Admin Setup Key (Only on register) */}
          {mode === "register" && (
            <div className="space-y-2 border-t border-gray-900 pt-3">
              <button
                type="button"
                onClick={() => setShowAdminSecret(!showAdminSecret)}
                className="text-[10px] font-bold text-gray-500 hover:text-amber-500 tracking-wider uppercase flex items-center space-x-1.5"
              >
                <Key className="h-3.5 w-3.5 text-gray-600" />
                <span>Usajili wa Admin (Special Setup Key)</span>
              </button>

              {showAdminSecret && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-[10px] font-semibold text-amber-500 uppercase">Siri ya Admin Setup Key</label>
                  <input
                    type="password"
                    id="admin-secret"
                    placeholder="Ingiza key ya admin ikiwa unayo"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full rounded-md border border-amber-900/40 bg-amber-950/5 py-1.5 px-3 text-xs text-amber-400 placeholder-amber-950/50 focus:border-amber-500 focus:outline-hidden transition font-mono"
                  />
                  <span className="block text-[9px] text-gray-500 leading-normal">
                    Ukijaza setup key sahihi, akaunti yako itaundwa kama Admin. Default testing key: <span className="font-mono text-amber-500 font-bold bg-amber-950/10 px-1 py-0.5 rounded">SaanGSMAdmin2026!</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-md bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 transition mt-2 cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center space-x-1">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Subiri kidogo...</span>
              </span>
            ) : mode === "login" ? (
              <span className="flex items-center space-x-1">
                <LogIn className="h-4 w-4" />
                <span>Ingia Kwenye Akaunti</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <UserPlus className="h-4 w-4" />
                <span>Sajili Akaunti Mpya</span>
              </span>
            )}
          </button>
        </form>

        {/* Toggle Mode footer link */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-900">
          {mode === "login" ? (
            <span>
              Huna akaunti ya SaanGSM bado?{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="cursor-pointer text-amber-500 font-bold hover:underline"
              >
                Sajili Hapa
              </button>
            </span>
          ) : (
            <span>
              Tayari unayo akaunti yako?{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="cursor-pointer text-amber-500 font-bold hover:underline"
              >
                Ingia Hapa
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
