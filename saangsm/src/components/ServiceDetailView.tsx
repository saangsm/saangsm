import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, ShoppingBag, Key, Smartphone, AlertTriangle, Cpu } from "lucide-react";
import { Service, User, ServiceInputRequirement } from "../types";

interface ServiceDetailViewProps {
  slug: string;
  user: User | null;
  onNavigate: (viewName: string, params?: any) => void;
}

export default function ServiceDetailView({ slug, user, onNavigate }: ServiceDetailViewProps) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/services/${slug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Huduma haijapatikana au haijawezeshwa bado.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.service) {
          setService(data.service);
          
          // Initialize form values
          const initialValues: Record<string, string> = {};
          if (data.service.requires_input) {
            try {
              const fields = JSON.parse(data.service.requires_input) as ServiceInputRequirement[];
              fields.forEach((field) => {
                initialValues[field.name] = "";
              });
            } catch (e) {
              console.error("Error parsing fields", e);
            }
          }
          setFormValues(initialValues);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Hitilafu imetokea katika kupata taarifa.");
        setLoading(false);
      });
  }, [slug]);

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      // Must be logged in to order
      onNavigate("login", { redirectTo: "service-detail", redirectParams: { slug } });
      return;
    }

    if (!service) return;

    // Validate inputs
    let fields: ServiceInputRequirement[] = [];
    if (service.requires_input) {
      try {
        fields = JSON.parse(service.requires_input);
      } catch (err) {}
    }

    for (const field of fields) {
      if (field.required && (!formValues[field.name] || formValues[field.name].trim() === "")) {
        setError(`Tafadhali jaza: ${field.label}`);
        return;
      }
    }

    setSubmitting(true);

    fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
      },
      body: JSON.stringify({
        service_id: service.id,
        quantity: 1,
        customer_input: formValues,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmitting(false);
        if (data.error) {
          setError(data.error);
        } else if (data.order_ref) {
          // Success! Navigate to checkout
          onNavigate("checkout", { order_ref: data.order_ref });
        }
      })
      .catch((err) => {
        setSubmitting(false);
        setError("Kuna tatizo la mtandao wakati wa kutuma ombi lako. Jaribu tena.");
      });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs text-gray-400 font-mono">Tunapakia maelezo ya huduma...</p>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-950/30 text-red-500 border border-red-900/40">
          <AlertTriangle className="h-6 w-6" />
        </div>
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

  if (!service) return null;

  const isRental = service.category_type === "rental";
  const isServer = service.category_type === "server";
  let inputFields: ServiceInputRequirement[] = [];
  if (service.requires_input) {
    try {
      inputFields = JSON.parse(service.requires_input);
    } catch (e) {}
  }

  return (
    <div id="service-detail-container" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => onNavigate("services")}
        className="inline-flex cursor-pointer items-center text-xs font-bold text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        <span>Rudi kwenye Huduma Zote</span>
      </button>

      {/* Main Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Service description details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-gray-800 bg-black p-6 rounded-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:10px_10px]" />

            <div className="space-y-2">
              {/* Category Badging */}
              <span className={`inline-block font-mono text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                isRental 
                  ? "border-blue-900/50 bg-blue-950/30 text-blue-400" 
                  : isServer 
                    ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400" 
                    : "border-amber-900/50 bg-amber-950/30 text-amber-400"
              }`}>
                {service.category_name}
              </span>

              <h1 className="font-sans text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {service.title}
              </h1>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed pt-2">
              {service.description}
            </p>

            {/* Timing and Service specifications */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-900">
              <div className="space-y-1">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-sans">Kasi ya Kazi</span>
                <span className="flex items-center text-xs font-bold text-white font-mono">
                  <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                  {service.delivery_label}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-sans">Aina ya Delivery</span>
                <span className="flex items-center text-xs font-bold text-white font-mono">
                  <Cpu className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  {isRental ? "Papo Hapo (Auto API)" : isServer ? "Muda Mchache (Server API)" : "IMEI Direct Sync"}
                </span>
              </div>
            </div>
          </div>

          {/* Guidelines info box */}
          <div className="border border-gray-800 bg-gray-950/50 p-5 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">Soma Kabla ya Kuagiza:</h3>
            <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Hakikisha namba ya IMEI/Serial utakayojaza ni sahihi 100%. Hakuna kurudisha hela ikiwa utajaza IMEI isiyo sahihi.</li>
              <li>Kama unakodisha zana, hakikisha kompyuta yako imesakinishwa (install) drivers zote za simu mapema na kisha upakue software share program yetu.</li>
              <li>Kupokea USSD push, uwe na simu karibu ili uingize namba yako ya siri mara tu utakapoanzisha checkout.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Order Input form */}
        <div className="lg:col-span-5">
          <div className="border border-gray-800 bg-gray-950 p-6 rounded-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-sans">Omba Huduma Hii</h2>
              <p className="text-xs text-gray-500">Kamilisha hatua hapa chini kutengeneza oda.</p>
            </div>

            {error && (
              <div className="rounded-md border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Price card display */}
              <div className="bg-black border border-gray-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Bei ya Huduma</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {service.price.toLocaleString()} <span className="text-xs text-white">TZS</span>
                  </span>
                </div>
                <ShoppingBag className="h-8 w-8 text-amber-500/20" />
              </div>

              {/* Dynamic Inputs Render */}
              {inputFields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === "select" ? (
                    <select
                      id={`input-${field.name}`}
                      value={formValues[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full rounded-md border border-gray-800 bg-black py-2.5 px-3 text-sm text-gray-200 focus:border-amber-500 focus:outline-hidden transition"
                      required={field.required}
                    >
                      <option value="">-- Chagua moja --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      id={`input-${field.name}`}
                      placeholder={field.placeholder || `Weka ${field.label.toLowerCase()}`}
                      value={formValues[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full rounded-md border border-gray-800 bg-black py-2.5 px-3 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-hidden transition font-mono"
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              {/* Order Button / Login Required warning */}
              {user ? (
                <button
                  type="submit"
                  id="submit-order-btn"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 transition cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center space-x-1.5">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Inasindika Oda...</span>
                    </span>
                  ) : (
                    <span>Tengeneza Oda & Lipia</span>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-md border border-amber-900/30 bg-amber-950/10 p-3 text-xs text-amber-400">
                    Unapaswa kuingia (Login) kwenye mfumo ili kukamilisha oda yako ya huduma ya GSM.
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("login", { redirectTo: "service-detail", redirectParams: { slug } })}
                    className="w-full inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-3 text-sm font-bold text-black hover:bg-amber-400 transition cursor-pointer"
                  >
                    Ingia kwenye Akaunti Kwanza
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
