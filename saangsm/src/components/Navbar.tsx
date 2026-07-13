import React from "react";
import { Cpu, User as UserIcon, LogOut, LayoutDashboard, Sliders } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  user: User | null;
  onNavigate: (viewName: string, params?: any) => void;
  currentView: string;
  onLogout: () => void;
}

export default function Navbar({ user, onNavigate, currentView, onLogout }: NavbarProps) {
  return (
    <header id="main-header" className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <div
          id="navbar-brand"
          className="flex cursor-pointer items-center space-x-2 text-amber-500 hover:text-amber-400 transition"
          onClick={() => onNavigate("home")}
        >
          <Cpu className="h-7 w-7 text-emerald-400 animate-pulse" />
          <span className="font-sans text-xl font-bold tracking-wider uppercase">
            Saan<span className="text-white">GSM</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav id="navbar-links" className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button
            onClick={() => onNavigate("home")}
            className={`cursor-pointer transition-colors ${
              currentView === "home" ? "text-amber-400" : "text-gray-300 hover:text-white"
            }`}
          >
            Nyumbani
          </button>
          <button
            onClick={() => onNavigate("services")}
            className={`cursor-pointer transition-colors ${
              currentView === "services" || currentView === "service-detail"
                ? "text-amber-400"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Huduma Zote
          </button>
          {user && (
            <button
              onClick={() => onNavigate("account")}
              className={`cursor-pointer transition-colors ${
                currentView === "account" ? "text-amber-400" : "text-gray-300 hover:text-white"
              }`}
            >
              Miamala & Historia
            </button>
          )}
        </nav>

        {/* Auth / Account Buttons */}
        <div id="navbar-auth-controls" className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* If Admin, show Dashboard link */}
              {user.role === "admin" && (
                <button
                  id="admin-dashboard-btn"
                  onClick={() => onNavigate("admin-dashboard")}
                  className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition ${
                    currentView === "admin-dashboard"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-gray-800 text-amber-400 hover:bg-gray-700"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Logged in User Display */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-gray-200">{user.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  {user.role === "admin" ? "Fundi Mkuu (Admin)" : "Mwanachama"}
                </span>
              </div>

              {/* Account icon button */}
              <button
                onClick={() => onNavigate("account")}
                title="Akaunti Yangu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-300 hover:border-amber-500 hover:text-amber-400 transition"
              >
                <UserIcon className="h-4.5 w-4.5" />
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                title="Toka"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-950/40 text-red-400 hover:bg-red-950 hover:text-red-300 border border-red-900/50 transition"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate("login")}
                className="rounded-md border border-gray-700 bg-transparent px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-900 hover:text-white transition"
              >
                Ingia
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
              >
                Sajili
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
