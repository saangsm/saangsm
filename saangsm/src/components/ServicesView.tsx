import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Clock, HelpCircle, ArrowUpDown } from "lucide-react";
import { Service, Category, CategoryType } from "../types";

interface ServicesViewProps {
  onNavigate: (viewName: string, params?: any) => void;
  categories: Category[];
  initialType?: string | null;
}

export default function ServicesView({ onNavigate, categories, initialType = null }: ServicesViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>(initialType || "all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    let url = "/api/services?";
    const params = new URLSearchParams();
    
    if (selectedType !== "all") {
      params.append("type", selectedType);
    }
    if (selectedCategory !== "all") {
      params.append("category_id", selectedCategory);
    }
    if (searchTerm.trim() !== "") {
      params.append("search", searchTerm);
    }

    fetch(url + params.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          setServices(data.services);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        setLoading(false);
      });
  }, [selectedType, selectedCategory, searchTerm]);

  return (
    <div id="services-view-container" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title */}
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Katalogi ya Huduma za <span className="text-amber-500">GSM</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Tafuta na uchague huduma ya simu unayotaka kuanzisha au kuitumia sasa. Malipo yote yanafanyika kwa mitandao ya simu za mkononi Tanzania.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div id="filter-toolbar" className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border border-gray-800 bg-gray-950 p-4 rounded-lg">
        {/* Search Input */}
        <div className="relative md:col-span-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            id="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tafuta huduma (mfano: UnlockTool, FRP, Samsung)..."
            className="w-full rounded-md border border-gray-800 bg-black py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500 focus:outline-hidden transition"
          />
        </div>

        {/* Categories Tab Pill Selector */}
        <div className="md:col-span-7 flex flex-wrap gap-2 justify-start md:justify-end">
          <button
            onClick={() => {
              setSelectedType("all");
              setSelectedCategory("all");
            }}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              selectedType === "all"
                ? "bg-amber-500 text-black"
                : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Zote
          </button>
          
          <button
            onClick={() => {
              setSelectedType("imei");
              setSelectedCategory("all");
            }}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              selectedType === "imei"
                ? "bg-amber-500 text-black"
                : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            IMEI & FRP
          </button>

          <button
            onClick={() => {
              setSelectedType("server");
              setSelectedCategory("all");
            }}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              selectedType === "server"
                ? "bg-amber-500 text-black"
                : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Server & Activations
          </button>

          <button
            onClick={() => {
              setSelectedType("rental");
              setSelectedCategory("all");
            }}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              selectedType === "rental"
                ? "bg-amber-500 text-black"
                : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Rentals (Kodi Tool)
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 rounded-lg bg-gray-900 border border-gray-800" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 bg-gray-950/40 rounded-lg space-y-3">
          <SlidersHorizontal className="mx-auto h-12 w-12 text-gray-600 animate-bounce" />
          <h3 className="text-base font-bold text-white">Hakuna Huduma Zilizopatikana</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Samahani, hakuna huduma zinazolingana na neno ulilotafuta kwa sasa. Tafadhali hakiki herufi zako au chagua kategoria nyingine.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedType("all");
              setSelectedCategory("all");
            }}
            className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition mt-2 cursor-pointer"
          >
            Onyesha Huduma Zote
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => {
            const isRental = service.category_type === "rental";
            const isServer = service.category_type === "server";
            
            return (
              <div
                key={service.id}
                id={`catalog-service-${service.id}`}
                className="group flex flex-col justify-between border border-gray-800 bg-black p-5 rounded-lg relative overflow-hidden hover:border-amber-500 transition duration-300"
              >
                {/* Visual hardware trace details on background */}
                <div className="absolute top-0 right-0 h-14 w-14 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:8px_8px]" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Pill Category Type */}
                    <span className={`inline-block font-mono text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                      isRental 
                        ? "border-blue-900/50 bg-blue-950/30 text-blue-400" 
                        : isServer 
                          ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400" 
                          : "border-amber-900/50 bg-amber-950/30 text-amber-400"
                    }`}>
                      {service.category_name}
                    </span>
                    
                    {/* Duration Delivery */}
                    <span className="flex items-center text-[10px] text-gray-500 font-mono">
                      <Clock className="mr-1 h-3 w-3 text-gray-600" />
                      {service.delivery_label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition font-sans">
                    {service.title}
                  </h3>
                  
                  <p className="text-xs text-gray-400 leading-relaxed min-h-[40px] line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-900">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-sans">Gharama</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {service.price.toLocaleString()} <span className="text-[10px] text-white">TZS</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onNavigate("service-detail", { slug: service.slug })}
                    className="rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-200 group-hover:bg-amber-500 group-hover:text-black transition cursor-pointer"
                  >
                    Agiza Huduma
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Notice card */}
      <div id="service-notice-panel" className="border border-gray-800 bg-gray-950/50 p-5 rounded-lg flex items-start space-x-3">
        <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">Maelezo Muhimu Kuhusu Huduma:</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Kila huduma ina vigezo vyake vya kipekee. Kwa mfano, huduma za IMEI zinakuhitaji uingize namba sahihi za IMEI za kifaa chako, wakati huduma za kodi (Rentals) hutoa login token ambazo ni za kujiunga papo hapo. Tafadhali hakikisha unasoma kwa makini maelezo ya kila huduma kabla ya kulipia.
          </p>
        </div>
      </div>
    </div>
  );
}
