import React, { useState, useEffect } from "react";
import { 
  Key, 
  Smartphone, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  ChevronRight, 
  Activity, 
  MessageCircle, 
  CheckCircle2, 
  Flame 
} from "lucide-react";
import { Service, Category } from "../types";

interface HomeViewProps {
  onNavigate: (viewName: string, params?: any) => void;
  categories: Category[];
}

export default function HomeView({ onNavigate, categories }: HomeViewProps) {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services?featured=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          setFeaturedServices(data.services.slice(0, 6));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading featured services:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div id="home-view-container" className="space-y-12 pb-16">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden border-b border-gray-800 bg-linear-to-b from-gray-950 via-black to-gray-950 py-16 sm:py-24">
        {/* Decorative Grid Lines to match "Diagnostic Workbench" theme */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#081c15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="mx-auto inline-flex items-center space-x-2 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 text-xs text-emerald-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono tracking-wider uppercase">JUKWAA NAMBA #1 LA MAFUNDI WA SIMU TANZANIA</span>
          </div>

          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto leading-tight">
            Anzisha Vifaa, Kodi Zana, na <span className="text-amber-500">Kimbiza Kazi</span> za GSM Papo Hapo!
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-400 sm:text-lg">
            SaanGSM inatoa huduma zenye kasi zaidi za IMEI/FRP Bypass, activation za Tool, na kukodisha (Rental) akaunti za zana za GSM kwa mafundi wa simu Tanzania.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate("services")}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-amber-500 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/10 hover:bg-amber-400 transition cursor-pointer"
            >
              <span>Angalia Huduma Zote</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
            <a
              href="https://wa.me/255757224250"
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-950 px-6 py-3.5 text-sm font-semibold text-gray-200 hover:bg-gray-900 transition"
            >
              <MessageCircle className="mr-2 h-5 w-5 text-emerald-400" />
              <span>Wasiliana Nasi WhatsApp</span>
            </a>
          </div>

          {/* KPI Mini dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-gray-900/60">
            <div className="border border-gray-900 bg-black/60 p-4 rounded-lg">
              <span className="block font-mono text-2xl font-bold text-amber-500">100%</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-sans">Kazi Salama</span>
            </div>
            <div className="border border-gray-900 bg-black/60 p-4 rounded-lg">
              <span className="block font-mono text-2xl font-bold text-emerald-400">&lt; Dakika 15</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-sans">Kasi ya Activation</span>
            </div>
            <div className="border border-gray-900 bg-black/60 p-4 rounded-lg">
              <span className="block font-mono text-2xl font-bold text-amber-500">2,500+</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-sans">Simu Zilizofunguliwa</span>
            </div>
            <div className="border border-gray-900 bg-black/60 p-4 rounded-lg">
              <span className="block font-mono text-2xl font-bold text-emerald-400">Maswali 24/7</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-sans">Msaada wa WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories / Services Pillars Section */}
      <section id="categories-pillars" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white sm:text-3xl font-sans tracking-tight">Kategoria Kuu Tatu za Huduma</h2>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">Chagua aina ya huduma kulingana na hitaji la kazi yako leo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: IMEI/FRP Bypass */}
          <div className="flex flex-col justify-between border border-gray-800 bg-linear-to-b from-gray-950 to-black p-6 rounded-lg hover:border-amber-500/50 transition duration-300">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">IMEI & FRP Bypass</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tunaondoa Google Lock (FRP), MDM Lock, iCloud Lock au Demo Mode kwa kutumia namba ya IMEI au Serial ya kifaa pekee. Hakuna haja ya kopo au kutuma kifaa.
              </p>
            </div>
            <button
              onClick={() => onNavigate("services", { type: "imei" })}
              className="mt-6 inline-flex items-center text-xs font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
            >
              <span>Fungua Simu Sasa</span>
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pillar 2: Server Activations */}
          <div className="flex flex-col justify-between border border-gray-800 bg-linear-to-b from-gray-950 to-black p-6 rounded-lg hover:border-emerald-500/50 transition duration-300">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Server & Activations</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Usajili au Activation rasmi ya akaunti zako za zana maarufu za GSM kama vile UnlockTool, DFT Pro, EFT Pro, Pandora Tool na TSM Tool. Tunakamilisha kwa dakika chache.
              </p>
            </div>
            <button
              onClick={() => onNavigate("services", { type: "server" })}
              className="mt-6 inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <span>Anza Activation Sasa</span>
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pillar 3: Rentals */}
          <div className="flex flex-col justify-between border border-gray-800 bg-linear-to-b from-gray-950 to-black p-6 rounded-lg hover:border-blue-500/50 transition duration-300">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tool Rentals (Kukodisha)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Huna uwezo wa kununua zana nzima kwa mwaka? Kodisha UnlockTool, DFT au TSM Tool kwa masaa 3 au masaa 6 ili umalize kazi moja ya mteja kwa bei nafuu sana.
              </p>
            </div>
            <button
              onClick={() => onNavigate("services", { type: "rental" })}
              className="mt-6 inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              <span>Kodisha Tool Sasa</span>
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Services Section (Component chip cards) */}
      <section id="featured-services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-500 uppercase">
              <Flame className="h-4 w-4 animate-bounce" />
              <span>Zilizochaguliwa (Featured)</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-sans tracking-tight">Huduma Zinazopendwa Zaidi</h2>
          </div>
          <button
            onClick={() => onNavigate("services")}
            className="text-xs font-bold text-gray-400 hover:text-amber-500 transition cursor-pointer"
          >
            Angalia Zote &rarr;
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-lg bg-gray-900 border border-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.map((service) => {
              const isRental = service.category_type === "rental";
              const isServer = service.category_type === "server";
              
              return (
                <div
                  key={service.id}
                  id={`service-chip-${service.id}`}
                  className="group flex flex-col justify-between border border-gray-800 bg-black p-5 rounded-lg relative overflow-hidden hover:border-amber-500 transition duration-300"
                >
                  {/* Subtle component trace styling */}
                  <div className="absolute top-0 right-0 h-16 w-16 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Category Badge */}
                      <span className={`inline-block font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                        isRental 
                          ? "border-blue-900/50 bg-blue-950/30 text-blue-400" 
                          : isServer 
                            ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400" 
                            : "border-amber-900/50 bg-amber-950/30 text-amber-400"
                      }`}>
                        {service.category_name}
                      </span>
                      
                      {/* Fast Delivery Indicator */}
                      <span className="flex items-center text-[10px] text-gray-500 font-mono">
                        <Clock className="mr-1 h-3 w-3" />
                        {service.delivery_label}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition font-sans">
                      {service.title}
                    </h3>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-900">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">Gharama</span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {service.price.toLocaleString()} <span className="text-[10px] text-white">TZS</span>
                      </span>
                    </div>
                    
                    <button
                      onClick={() => onNavigate("service-detail", { slug: service.slug })}
                      className="rounded-md bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-200 group-hover:bg-amber-500 group-hover:text-black transition cursor-pointer"
                    >
                      Agiza
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tanzanian Mobile Money Info Banner */}
      <section id="payment-methods" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-800 bg-linear-to-r from-gray-950 via-black to-gray-950 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient(circle_at_bottom_left,#ffb02005,transparent_40%)" />
          
          <div className="space-y-3 relative z-10">
            <h2 className="text-xl font-bold text-white font-sans">Malipo ya Papo Hapo Tanzania (Mobile Money)</h2>
            <p className="text-gray-400 text-xs max-w-xl leading-relaxed">
              Lipia kwa usalama na kasi kubwa ukitumia Mitandao yote ya simu Tanzania. Tutatuma ombi la malipo (USSD Push) moja kwa moja kwenye namba yako ya simu.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-bold font-mono">M-PESA (VODACOM)</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-950/20 border border-amber-900/30 text-xs text-amber-400 font-bold font-mono">TIGO PESA</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-950/20 border border-red-900/30 text-xs text-red-500 font-bold font-mono font-mono">AIRTEL MONEY</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-400 font-bold font-mono">HALOPESA</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
            <div className="border border-gray-800 bg-gray-950 px-5 py-4 rounded-lg flex items-center space-x-3">
              <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-xs font-bold text-white">Miamala Salama</span>
                <span className="text-[10px] text-gray-500">Inalindwa na AzamPay / Selcom</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Support Banner */}
      <section id="tech-support" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border border-emerald-900/40 bg-emerald-950/10 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-sans">Je, wewe ni mgeni au unahitaji usaidizi wa kiufundi?</h4>
              <p className="text-xs text-gray-400">Fundi SaanGSM yupo hewani kusaidia kuanzisha zana, kutoa maelekezo ya matumizi na usaidizi wowote.</p>
            </div>
          </div>
          <a
            href="https://wa.me/255757224250?text=Habari%20SaanGSM,%20nahitaji%20msaada%20wa%20huduma"
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-full md:w-auto inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            <span>Chat nasi WhatsApp (0757224250)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
