import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import ServicesView from "./components/ServicesView";
import ServiceDetailView from "./components/ServiceDetailView";
import CheckoutView from "./components/CheckoutView";
import AuthView from "./components/AuthView";
import AccountView from "./components/AccountView";
import AdminDashboardView from "./components/AdminDashboardView";
import { User, Category } from "./types";
import { MessageCircle, HelpCircle, Shield, Cpu } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<string>("home");
  const [viewParams, setViewParams] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Restore session & load categories on mount
  useEffect(() => {
    const token = localStorage.getItem("saangsm_token");
    
    // 1. Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error("Error loading categories:", err));

    // 2. Fetch authenticated user if token exists
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Token expired");
          }
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setUser(data.user);
          }
          setAuthChecking(false);
        })
        .catch(() => {
          localStorage.removeItem("saangsm_token");
          setUser(null);
          setAuthChecking(false);
        });
    } else {
      setAuthChecking(false);
    }
  }, []);

  const handleNavigate = (viewName: string, params: any = null) => {
    setCurrentView(viewName);
    setViewParams(params);
    // Scroll to top on navigation to give a natural page shift feel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuthSuccess = (authUser: User, token: string) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("saangsm_token");
    setUser(null);
    handleNavigate("home");
  };

  const renderView = () => {
    if (authChecking) {
      return (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs text-gray-400 font-mono">Uthibitisho wa Mtumiaji...</p>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        return <HomeView onNavigate={handleNavigate} categories={categories} />;
      case "services":
        return (
          <ServicesView
            onNavigate={handleNavigate}
            categories={categories}
            initialType={viewParams?.type}
          />
        );
      case "service-detail":
        return (
          <ServiceDetailView
            slug={viewParams?.slug}
            user={user}
            onNavigate={handleNavigate}
          />
        );
      case "checkout":
        return (
          <CheckoutView
            orderRef={viewParams?.order_ref}
            user={user}
            onNavigate={handleNavigate}
          />
        );
      case "login":
      case "register":
        return (
          <AuthView
            initialMode={currentView === "login" ? "login" : "register"}
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
            redirectParams={viewParams}
          />
        );
      case "account":
        return <AccountView user={user} onNavigate={handleNavigate} />;
      case "admin-dashboard":
        return <AdminDashboardView user={user} onNavigate={handleNavigate} />;
      default:
        return <HomeView onNavigate={handleNavigate} categories={categories} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-gray-200">
      {/* Background decorative circuits grids */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-40" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Head */}
        <Navbar
          user={user}
          onNavigate={handleNavigate}
          currentView={currentView}
          onLogout={handleLogout}
        />

        {/* Main Stage */}
        <main className="grow">
          {renderView()}
        </main>

        {/* Footer */}
        <footer className="relative border-t border-gray-900 bg-black py-12 text-sm text-gray-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Pillar brand */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-amber-500">
                  <Cpu className="h-6 w-6 text-emerald-400 animate-pulse" />
                  <span className="font-sans text-lg font-bold tracking-wider uppercase">
                    Saan<span className="text-white">GSM</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Soko linaloaminika na kuongoza kwa ajili ya kutoa huduma za GSM (IMEI, activations, na rentals) kwa mafundi wote wa simu nchini Tanzania.
                </p>
              </div>

              {/* Quick links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Viunganishi Haraka</h4>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <button onClick={() => handleNavigate("home")} className="hover:text-amber-500 transition cursor-pointer">
                      Nyumbani
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate("services")} className="hover:text-amber-500 transition cursor-pointer">
                      Huduma Zote za GSM
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate("services", { type: "rental" })} className="hover:text-amber-500 transition cursor-pointer">
                      Kodi Tools (Rentals)
                    </button>
                  </li>
                </ul>
              </div>

              {/* Support & Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Mawasiliano na Msaada</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center space-x-2 text-gray-400">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    <span>WhatsApp: +255 757 224 250</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-400">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    <span>Email: PeterMsuku@saangsm.com</span>
                  </li>
                  <li className="text-[10px] text-gray-500 leading-relaxed italic">
                    Tupo wazi kuanzia saa 2:00 Asubuhi hadi saa 4:00 Usiku (EAT) kila siku.
                  </li>
                </ul>
              </div>

              {/* Legals / Security disclaimer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Usalama & Dhamana</h4>
                <div className="flex items-start space-x-2 text-xs text-gray-500 leading-relaxed">
                  <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    Miamala yetu inalindwa na mifumo ya siri ya encryption. Tunaheshimu haki za watumiaji na kuwasilisha huduma kwa haraka na uhakika mkubwa.
                  </p>
                </div>
              </div>
            </div>

            {/* Copyright notes */}
            <div className="border-t border-gray-950 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
              <span>
                &copy; 2026 SaanGSM Marketplace. Haki zote zimehifadhiwa.
              </span>
              <div className="flex space-x-4">
                <span className="hover:text-gray-400 transition cursor-pointer">Vigezo na Masharti</span>
                <span>•</span>
                <span className="hover:text-gray-400 transition cursor-pointer">Sera ya Faragha</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
