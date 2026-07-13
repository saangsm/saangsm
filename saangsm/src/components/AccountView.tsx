import React, { useState, useEffect } from "react";
import { 
  History, 
  Clock, 
  Key, 
  Smartphone, 
  AlertTriangle, 
  Copy, 
  Download, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Lock
} from "lucide-react";
import { User, Order, Rental } from "../types";

interface AccountViewProps {
  user: User | null;
  onNavigate: (viewName: string, params?: any) => void;
}

export default function AccountView({ user, onNavigate }: AccountViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [loadingRentalId, setLoadingRentalId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      onNavigate("login");
      return;
    }

    setLoading(true);
    fetch("/api/orders/my", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Imeshindikana kupata historia yako ya miamala.");
        return res.json();
      })
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Hitilafu imetokea.");
        setLoading(false);
      });
  }, [user]);

  const handleToggleExpand = (orderId: number, orderRef: string, isRental: boolean) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setSelectedRental(null);
    } else {
      setExpandedOrderId(orderId);
      setSelectedRental(null);
      
      if (isRental) {
        setLoadingRentalId(orderId);
        fetch(`/api/orders/${orderRef}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("saangsm_token")}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            setLoadingRentalId(null);
            if (data.rental) {
              setSelectedRental(data.rental);
            }
          })
          .catch((err) => {
            setLoadingRentalId(null);
            console.error("Error loading rental info", err);
          });
      }
    }
  };

  const handleCopyCredentials = (creds: string) => {
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment":
        return <span className="inline-flex items-center rounded-full bg-amber-950/25 border border-amber-900/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 font-mono uppercase">Pending</span>;
      case "paid":
        return <span className="inline-flex items-center rounded-full bg-emerald-950/20 border border-emerald-900/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono uppercase">Kulipwa</span>;
      case "processing":
        return <span className="inline-flex items-center rounded-full bg-blue-950/20 border border-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 font-mono uppercase">Processing</span>;
      case "completed":
        return <span className="inline-flex items-center rounded-full bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono uppercase">Completed</span>;
      case "failed":
        return <span className="inline-flex items-center rounded-full bg-red-950/20 border border-red-900/40 px-2.5 py-0.5 text-[10px] font-bold text-red-400 font-mono uppercase">Failed</span>;
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-gray-900 border border-gray-800 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 font-mono uppercase">Cancelled</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] font-bold text-gray-400 font-mono uppercase">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs text-gray-400 font-mono">Tunapakia historia ya oda zako...</p>
      </div>
    );
  }

  return (
    <div id="account-view-container" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Profile summary header */}
      <div id="profile-summary" className="border border-gray-800 bg-gray-950 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-16 w-16 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-full border border-gray-850 bg-black flex items-center justify-center font-extrabold text-lg text-amber-500 uppercase">
            {user?.name.substring(0, 2)}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-sans">{user?.name}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-mono">
              <span>{user?.email}</span>
              <span className="text-gray-800">•</span>
              <span>{user?.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 font-mono">
            {user?.role === "admin" ? "Fundi Mkuu (Admin)" : "Mwanachama wa SaanGSM"}
          </span>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-900 pb-3">
          <History className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-white font-sans">Historia ya Miamala na Oda Zako</h2>
        </div>

        {error && (
          <div className="rounded-md border border-red-900/40 bg-red-950/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16 border border-gray-850 bg-black rounded-lg space-y-3">
            <Smartphone className="mx-auto h-12 w-12 text-gray-700 animate-bounce" />
            <h3 className="text-base font-bold text-white">Hujatengeneza Oda Yoyote Bado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Historia ya miamala yako ya kuanzisha simu (IMEI), activation, na kodi za akaunti (Rentals) itaonekana hapa pindi utakapoagiza.
            </p>
            <button
              onClick={() => onNavigate("services")}
              className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition"
            >
              Agiza Huduma ya Kwanza
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isRentalType = order.service_type === "rental";
              let inputsObj: Record<string, string> = {};
              if (order.customer_input) {
                try {
                  inputsObj = JSON.parse(order.customer_input);
                } catch (e) {}
              }

              return (
                <div
                  key={order.id}
                  id={`my-order-row-${order.id}`}
                  className="border border-gray-800 bg-gray-950/40 rounded-lg overflow-hidden hover:bg-black/40 transition duration-150"
                >
                  {/* Row Header clickable to toggle */}
                  <div
                    onClick={() => handleToggleExpand(order.id, order.order_ref, isRentalType)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-9 w-9 rounded bg-black border border-gray-900 flex items-center justify-center shrink-0">
                        {isRentalType ? (
                          <Key className="h-5 w-5 text-blue-400" />
                        ) : order.service_type === "server" ? (
                          <Cpu className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Smartphone className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <h4 className="text-sm font-bold text-white font-sans leading-tight">{order.service_title}</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-500">
                          <span className="font-bold text-amber-500">{order.order_ref}</span>
                          <span>•</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-x-6">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {order.total_amount.toLocaleString()} <span className="text-[10px] text-white">TZS</span>
                        </span>
                        <span className="text-[9px] text-gray-500 font-sans uppercase">Muda: {order.delivery_label}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}
                        <button className="text-gray-500 hover:text-white">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-900 bg-black/90 p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Submitted custom details */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans">Taarifa Ulizowasilisha (Input)</h5>
                          <div className="bg-gray-950 p-4 rounded-md border border-gray-900 space-y-2">
                            {Object.keys(inputsObj).length === 0 ? (
                              <span className="text-xs text-gray-500 italic">Hakuna maelezo ya ziada yaliyohitajika.</span>
                            ) : (
                              Object.entries(inputsObj).map(([key, val]) => (
                                <div key={key} className="flex justify-between text-xs font-mono">
                                  <span className="text-gray-500 uppercase">{key.replace(/_/g, " ")}:</span>
                                  <span className="text-white font-bold">{val}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Order timeline and Admin notes */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans">Mrejesho na Maelekezo (Feedback)</h5>
                          <div className="bg-gray-950 p-4 rounded-md border border-gray-900 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Hali ya Kazi:</span>
                              <span className="font-bold text-white font-mono uppercase">{order.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Imesasishwa:</span>
                              <span className="text-white font-mono">{new Date(order.updated_at).toLocaleString()}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-900 space-y-1">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase">Maelezo ya Fundi (Admin Notes):</span>
                              <p className="text-gray-300 italic">
                                {order.admin_notes || "Subiri kidogo, ombi lako linafanyiwa uhakiki na litasasishwa hivi punde."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display Rented Credentials */}
                      {isRentalType && (
                        <div className="border-t border-gray-900 pt-4 space-y-3">
                          <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">Akaunti ya Kodi ya Zana (Active Rental)</h5>
                          
                          {loadingRentalId === order.id ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                              <span>Tunapakia logins za tool...</span>
                            </div>
                          ) : selectedRental ? (
                            <div className="border border-emerald-800 bg-emerald-950/5 p-4 rounded-md space-y-3">
                              <div className="flex items-center justify-between border-b border-emerald-950/60 pb-1.5">
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Logins Details za Kujaza kwenye Tool</span>
                                <button
                                  onClick={() => handleCopyCredentials(selectedRental.access_credentials || "")}
                                  className="cursor-pointer text-[11px] font-bold text-gray-300 hover:text-white inline-flex items-center space-x-1"
                                >
                                  <Copy className="h-3 w-3 text-emerald-400" />
                                  <span>{copied ? "Ime-copy!" : "Copy logins zote"}</span>
                                </button>
                              </div>

                              <pre className="font-mono text-xs text-gray-200 bg-black p-3 rounded-md overflow-x-auto border border-gray-900 whitespace-pre-wrap leading-relaxed">
                                {selectedRental.access_credentials}
                              </pre>

                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                                <span className="text-[11px] text-gray-400">
                                  Inamalizika muda:{" "}
                                  <span className="text-amber-500 font-mono font-bold">
                                    {selectedRental.expires_at ? new Date(selectedRental.expires_at).toLocaleString() : "..."}
                                  </span>
                                </span>
                                <a
                                  href="https://saangsm.com/downloads/sharing-client.exe"
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="inline-flex items-center justify-center text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  <span>Pakua sharing app</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-gray-900 bg-gray-950 p-4 rounded-md flex items-center space-x-2 text-xs text-gray-500">
                              <Lock className="h-4 w-4 text-gray-600 shrink-0" />
                              <span>
                                {order.status === "pending_payment" 
                                  ? "Kamilisha kwanza malikopo ili upate akaunti details za tool." 
                                  : "Akaunti yako ya kukodi bado haijazalishwa, au imekwisha muda wake."}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pending payment checkout trigger */}
                      {order.status === "pending_payment" && (
                        <div className="border-t border-gray-900 pt-4 flex justify-end">
                          <button
                            onClick={() => onNavigate("checkout", { order_ref: order.order_ref })}
                            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                          >
                            <span>Lipa Oda Hii Sasa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
