import React, { useState, useEffect, useRef } from "react";
import { CreditCard, ArrowLeft, ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, Copy, Download, MessageSquare } from "lucide-react";
import { User, Order, Rental } from "../types";

interface CheckoutViewProps {
  orderRef: string;
  user: User | null;
  onNavigate: (viewName: string, params?: any) => void;
}

const PROVIDERS = [
  { id: "M-Pesa", name: "M-Pesa (Vodacom)", color: "border-red-500 bg-red-950/20 text-red-400 font-mono", logoText: "V" },
  { id: "Tigo Pesa", name: "Tigo Pesa", color: "border-amber-500 bg-amber-950/20 text-amber-400 font-mono", logoText: "T" },
  { id: "Airtel Money", name: "Airtel Money", color: "border-red-600 bg-red-950/20 text-red-500 font-mono", logoText: "A" },
  { id: "HaloPesa", name: "HaloPesa", color: "border-emerald-600 bg-emerald-950/20 text-emerald-400 font-mono", logoText: "H" }
];

export default function CheckoutView({ orderRef, user, onNavigate }: CheckoutViewProps) {
  const [order, setOrder] = useState<any>(null);
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Payment initiation inputs
  const [selectedProvider, setSelectedProvider] = useState("M-Pesa");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [initiating, setInitiating] = useState(false);
  
  // Status tracking states
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success" | "failed">("idle");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [adminNotes, setAdminNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Load initial order details
    setLoading(true);
    fetch(`/api/orders/${orderRef}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Oda haikupatikana.");
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setRental(data.rental);
        // If order already paid/completed, show success directly
        if (["paid", "processing", "completed"].includes(data.order.status)) {
          setPaymentStatus("success");
          setAdminNotes(data.order.admin_notes || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Imeshindikana kupata taarifa za oda yako.");
        setLoading(false);
      });

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [orderRef]);

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setError("Tafadhali weka namba sahihi ya simu yenye tarakimu 10 (Mfano: 0712345678).");
      return;
    }

    setInitiating(true);
    
    fetch("/api/payments/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
      },
      body: JSON.stringify({
        order_ref: orderRef,
        provider: selectedProvider,
        phone_number: phoneNumber,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setInitiating(false);
        if (data.error) {
          setError(data.error);
        } else {
          // Success initiation! Start countdown and polling
          setPaymentStatus("polling");
          setSecondsLeft(60);
          startCountdown();
          startPolling();
        }
      })
      .catch((err) => {
        setInitiating(false);
        setError("Mtatizo ya mtandao yamekwamisha kuanza malipo. Jaribu tena.");
      });
  };

  const startCountdown = () => {
    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          clearInterval(pollIntervalRef.current);
          setPaymentStatus("failed");
          setError("Muda wa malipo umekwisha (Timeout). Tafadhali weka PIN kwa haraka zaidi.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPolling = () => {
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/payments/status/${orderRef}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (["paid", "processing", "completed"].includes(data.status)) {
            // Payment success!
            clearInterval(pollIntervalRef.current);
            clearInterval(countdownIntervalRef.current);
            setPaymentStatus("success");
            setAdminNotes(data.admin_notes || "");
            
            // Reload order to fetch newly provisioned rental credentials if any
            fetch(`/api/orders/${orderRef}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
              },
            })
              .then((res) => res.json())
              .then((innerData) => {
                setOrder(innerData.order);
                setRental(innerData.rental);
              });
          } else if (data.status === "failed") {
            // Payment failed (insufficient money or cancelled)
            clearInterval(pollIntervalRef.current);
            clearInterval(countdownIntervalRef.current);
            setPaymentStatus("failed");
            setError(data.admin_notes || "Muamala umekataliwa au umeshindikana kutoka mtandao wa simu.");
          }
        })
        .catch((err) => {
          console.error("Polling error", err);
        });
    }, 2500);
  };

  const handleCopyCredentials = () => {
    if (rental?.access_credentials) {
      navigator.clipboard.writeText(rental.access_credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs text-gray-400 font-mono">Tunatayarisha mchakato wa checkout...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4 border border-gray-950 bg-black/50 rounded-lg">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="text-base font-bold text-white">{error}</h3>
        <button
          onClick={() => onNavigate("services")}
          className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          <span>Rudi kwenye huduma</span>
        </button>
      </div>
    );
  }

  return (
    <div id="checkout-view-container" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Back Link */}
      <button
        onClick={() => onNavigate("services")}
        className="inline-flex cursor-pointer items-center text-xs font-bold text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        <span>Ghairi & Rudi nyuma</span>
      </button>

      {/* Checkout States Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Order summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-gray-800 bg-black p-5 rounded-lg space-y-4">
            <h2 className="text-sm font-bold text-white font-sans uppercase tracking-wider border-b border-gray-950 pb-2">Muhtasari wa Oda</h2>
            
            <div className="space-y-1.5">
              <span className="block text-[10px] text-gray-500 uppercase">Huduma</span>
              <span className="block text-sm font-bold text-white leading-snug">{order.service_title}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-[10px] text-gray-500 uppercase">Rejea ya Oda</span>
                <span className="block text-xs font-mono font-bold text-amber-500">{order.order_ref}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-gray-500 uppercase">Uwasilishaji</span>
                <span className="block text-xs font-bold text-gray-300">{order.delivery_label}</span>
              </div>
            </div>

            {/* Price section */}
            <div className="bg-gray-950 p-4 rounded-md border border-gray-900 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Jumla ya Malipo</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {order.total_amount.toLocaleString()} <span className="text-[10px] text-white">TZS</span>
              </span>
            </div>
          </div>

          <div className="border border-gray-900 bg-gray-950/30 p-4 rounded-lg flex items-start space-x-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block text-xs font-bold text-white font-sans">Malipo Salama na ya Kasi</span>
              <span className="block text-[10px] text-gray-400 leading-relaxed">
                Taarifa za muamala wako hufichwa na kulindwa chini ya standard za AzamPay / Mobile Money Tanzania APIs. Hakuna makato ya ziada ya siri.
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Dynamic checkout states */}
        <div className="lg:col-span-7">
          {paymentStatus === "idle" && (
            <div className="border border-gray-800 bg-gray-950 p-6 rounded-lg space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-sans">Chagua Njia ya Malipo</h3>
                <p className="text-xs text-gray-500">M-Pesa, Tigo Pesa, Airtel Money au HaloPesa. Tutatuma Push ya malipo.</p>
              </div>

              {error && (
                <div className="rounded-md border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleInitiatePayment} className="space-y-6">
                {/* Provider selection buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        id={`provider-btn-${p.id}`}
                        onClick={() => setSelectedProvider(p.id)}
                        className={`cursor-pointer rounded-lg border p-3 flex items-center space-x-2.5 text-left transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-gray-800 bg-black hover:border-gray-700"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-extrabold text-sm ${p.color}`}>
                          {p.logoText}
                        </div>
                        <span className="text-xs font-bold text-white leading-tight">{p.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile number input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Namba ya Simu ya Kufanyia Malipo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="checkout-phone-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Mfano: 0712345678 au 0757224250"
                    maxLength={10}
                    className="w-full rounded-md border border-gray-800 bg-black py-2.5 px-3 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition font-mono"
                    required
                  />
                  <span className="block text-[10px] text-gray-500">
                    Namba hii itapokea ujumbe wa USSD (Simu iwe karibu yako na uweke salio la kutosha).
                  </span>
                </div>

                {/* Submit payment button */}
                <button
                  type="submit"
                  id="checkout-initiate-btn"
                  disabled={initiating}
                  className="w-full inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 transition cursor-pointer"
                >
                  {initiating ? (
                    <span className="flex items-center space-x-1.5">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Inatuma ombi la Push...</span>
                    </span>
                  ) : (
                    <span>Lipa Sasa (Leta Push ya Simu)</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {paymentStatus === "polling" && (
            <div className="border border-gray-800 bg-gray-950 p-8 rounded-lg text-center space-y-6 relative overflow-hidden">
              {/* Spinner loader indicator */}
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-gray-900" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white font-sans">Ombi la Malipo Limeshatumwa kwenye Simu!</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Tafadhali angalia screen ya simu yako sasa hivi. Utaona pop-up inayokuomba uweke namba ya siri (PIN) ya mtandao wa <span className="font-bold text-amber-500">{selectedProvider}</span> ili uidhinishe malipo ya <span className="font-bold font-mono text-emerald-400">{order.total_amount.toLocaleString()} TZS</span>.
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 rounded-full border border-gray-800 bg-black px-4 py-1.5 text-xs">
                <span className="text-gray-500 font-sans uppercase">Muda unaokwenda:</span>
                <span className="font-mono font-bold text-amber-400">{secondsLeft}s</span>
              </div>

              <div className="pt-2 border-t border-gray-900 text-left max-w-sm mx-auto space-y-1">
                <span className="block text-[9px] text-gray-500 font-bold uppercase text-center">Kidokezo cha Majaribio (Testing Option)</span>
                <span className="block text-[10px] text-gray-400 text-center italic">
                  Katika simulation, malipo yatakamilika kiotomatiki baada ya sekunde 5. Weka namba ya simu inayoishia na <span className="text-red-400 font-bold font-mono">0000</span> kuona muamala ukikataliwa.
                </span>
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="border border-emerald-900/40 bg-black p-6 rounded-lg space-y-6">
              {/* Success badge */}
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-white font-sans">Malipo Yamepokelewa!</h3>
                <p className="text-xs text-gray-400">Oda yako ya huduma ya GSM tayari imeshathibitishwa na kuanza kufanyiwa kazi.</p>
              </div>

              {/* If Rental: Show accounts logins immediately */}
              {rental && rental.access_credentials ? (
                <div className="space-y-4 border border-emerald-800 bg-emerald-950/10 p-5 rounded-lg">
                  <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Maelezo ya Ku-Login kwenye Tool</span>
                    <button
                      onClick={handleCopyCredentials}
                      className="cursor-pointer text-xs font-bold text-gray-300 hover:text-white inline-flex items-center space-x-1"
                    >
                      <Copy className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{copied ? "Ime-copy!" : "Copy Taarifa"}</span>
                    </button>
                  </div>

                  {/* Access details display using JetBrains Mono code style */}
                  <pre className="font-mono text-xs text-gray-200 bg-black/80 p-3.5 rounded-md overflow-x-auto border border-gray-900 whitespace-pre-wrap leading-relaxed">
                    {rental.access_credentials}
                  </pre>

                  {/* Expiry and software download links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="text-xs text-gray-400">
                      Muda wako unaisha:{" "}
                      <span className="text-amber-500 font-mono font-bold">
                        {rental.expires_at ? new Date(rental.expires_at).toLocaleString() : "Tafuta akaunti"}
                      </span>
                    </div>
                    <a
                      href="https://saangsm.com/downloads/sharing-client.exe"
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center justify-center text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      <span>Pakua Sharing Client</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-800 bg-gray-950 p-4 rounded-lg space-y-2">
                  <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono text-amber-500">Usaidizi na Maendeleo ya Oda:</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Huduma hii inafanyiwa kazi kwa sasa na mafundi wetu. Kasi ya uwasilishaji: <span className="font-bold text-white">{order.delivery_label}</span>. 
                    {adminNotes && <span className="block mt-2 text-emerald-400 font-mono text-xs">Mrejesho wa Admin: {adminNotes}</span>}
                  </p>
                </div>
              )}

              {/* Back to Home Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => onNavigate("account")}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center rounded-md border border-gray-800 bg-gray-950 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-900 transition cursor-pointer"
                >
                  <span>Angalia Oda Zangu</span>
                </button>
                <button
                  onClick={() => onNavigate("home")}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition cursor-pointer"
                >
                  <span>Rudi Nyumbani</span>
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="border border-red-900/40 bg-black p-6 rounded-lg text-center space-y-6">
              <div className="space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
                  <XCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">Malipo Yameshindikana!</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {error || "Tunaomba radhi, ombi la malipo limekataliwa au limeshindikana kukamilika."}
                </p>
              </div>

              <div className="bg-gray-950 border border-gray-900 p-4 rounded-lg text-left text-xs text-gray-400 space-y-1.5">
                <span className="block font-bold text-white font-mono uppercase text-red-400">Sababu Zinazoweza Kusababisha:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Salio lako la simu linapungua kuliko gharama ya huduma ({order.total_amount.toLocaleString()} TZS).</li>
                  <li>Umechelewa kuweka PIN ya malipo ndani ya sekunde 60 tangu push ilipotumwa.</li>
                  <li>Umeghairi pop-up ya malipo kwenye simu yako.</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentStatus("idle")}
                  className="w-full inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition cursor-pointer"
                >
                  Jaribu Tena Kulipia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
