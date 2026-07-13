import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  Users, 
  Smartphone, 
  FolderPlus, 
  DollarSign, 
  Clock, 
  Activity, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Key, 
  Cpu, 
  Save 
} from "lucide-react";
import { User, Order, Category, Service, DashboardStats, OrderStatus } from "../types";

interface AdminDashboardViewProps {
  user: User | null;
  onNavigate: (viewName: string, params?: any) => void;
}

export default function AdminDashboardView({ user, onNavigate }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "orders" | "services" | "categories" | "customers">("stats");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Expand states
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Form edit states
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderAdminNotes, setOrderAdminNotes] = useState<string>("");
  const [orderAccessCreds, setOrderAccessCreds] = useState<string>("");

  // Category Form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catType, setCatType] = useState<"imei" | "server" | "rental">("imei");
  const [catDesc, setCatDesc] = useState("");

  // Service Form
  const [servCatId, setServCatId] = useState<number>(0);
  const [servTitle, setServTitle] = useState("");
  const [servSlug, setServSlug] = useState("");
  const [servDesc, setServDesc] = useState("");
  const [servPrice, setServPrice] = useState<number>(0);
  const [servDelivery, setServDelivery] = useState("");
  const [servInputs, setServInputs] = useState(""); // JSON string
  const [servFeatured, setServFeatured] = useState(false);
  const [servActive, setServActive] = useState(true);
  const [servStock, setServStock] = useState<number>(999);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      onNavigate("home");
      return;
    }
    loadAllData();
  }, [user]);

  const loadAllData = () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("saangsm_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/admin/stats", { headers }).then((r) => r.json()),
      fetch("/api/admin/orders", { headers }).then((r) => r.json()),
      fetch("/api/admin/services", { headers }).then((r) => r.json()),
      fetch("/api/admin/categories", { headers }).then((r) => r.json()),
      fetch("/api/admin/customers", { headers }).then((r) => r.json())
    ])
      .then(([statsData, ordersData, servicesData, categoriesData, customersData]) => {
        if (statsData.error || ordersData.error || servicesData.error || categoriesData.error || customersData.error) {
          setError("Imeshindikana kupata taarifa za utawala kutoka kwenye server.");
        } else {
          setStats(statsData.stats);
          setOrders(ordersData.orders || []);
          setServices(servicesData.services || []);
          setCategories(categoriesData.categories || []);
          setCustomers(customersData.customers || []);
          
          if (categoriesData.categories && categoriesData.categories.length > 0) {
            setServCatId(categoriesData.categories[0].id);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Imeshindikana kuunganisha na server ya SaanGSM.");
        setLoading(false);
      });
  };

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // Customer status Toggle
  const handleToggleCustomer = (customerId: number) => {
    const token = localStorage.getItem("saangsm_token");
    fetch(`/api/admin/customers/${customerId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback(data.message);
          loadAllData();
        }
      });
  };

  // Order update
  const handleUpdateOrder = (e: React.FormEvent, orderId: number) => {
    e.preventDefault();
    const token = localStorage.getItem("saangsm_token");
    fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: orderStatus,
        admin_notes: orderAdminNotes,
        access_credentials: orderAccessCreds
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback("Oda ya mteja imesasishwa kikamilifu!");
          setExpandedOrderId(null);
          loadAllData();
        }
      });
  };

  const startOrderEdit = (order: Order) => {
    setOrderStatus(order.status);
    setOrderAdminNotes(order.admin_notes || "");
    setOrderAccessCreds("");
    
    // Fetch rental creds if any
    if (order.service_type === "rental") {
      const token = localStorage.getItem("saangsm_token");
      fetch(`/api/orders/${order.order_ref}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.rental) {
            setOrderAccessCreds(d.rental.access_credentials || "");
          }
        });
    }
  };

  // Category Create / Edit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("saangsm_token");
    const method = editingCategoryId ? "PUT" : "POST";
    const url = editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : "/api/admin/categories";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: catName,
        slug: catSlug,
        type: catType,
        description: catDesc
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback(editingCategoryId ? "Kategoria imerekebishwa!" : "Kategoria mpya imeongezwa!");
          clearCategoryForm();
          loadAllData();
        }
      });
  };

  const handleDeleteCategory = (id: number) => {
    if (!confirm("Je, una uhakika unataka kufuta kategoria hii? Huduma zote chini yake zitafutwa pia.")) return;
    const token = localStorage.getItem("saangsm_token");
    fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback("Kategoria imefutwa!");
          loadAllData();
        }
      });
  };

  const startCategoryEdit = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatType(cat.type);
    setCatDesc(cat.description || "");
  };

  const clearCategoryForm = () => {
    setEditingCategoryId(null);
    setCatName("");
    setCatSlug("");
    setCatType("imei");
    setCatDesc("");
  };

  // Service Save
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("saangsm_token");
    const method = editingServiceId ? "PUT" : "POST";
    const url = editingServiceId ? `/api/admin/services/${editingServiceId}` : "/api/admin/services";

    // Basic fields validation for inputs json
    let inputsVal = servInputs;
    if (inputsVal.trim() === "") {
      inputsVal = "[]";
    } else {
      try {
        JSON.parse(inputsVal);
      } catch (err) {
        showFeedback("JSON ya Fields za IMEI/Input si sahihi. Hakikisha ni valid JSON array.", true);
        return;
      }
    }

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category_id: servCatId,
        title: servTitle,
        slug: servSlug,
        description: servDesc,
        price: Number(servPrice),
        delivery_label: servDelivery,
        requires_input: inputsVal,
        is_featured: servFeatured ? 1 : 0,
        is_active: servActive ? 1 : 0,
        stock: Number(servStock)
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback(editingServiceId ? "Huduma imerekebishwa!" : "Huduma mpya imezalishwa!");
          clearServiceForm();
          loadAllData();
        }
      });
  };

  const handleDeleteService = (id: number) => {
    if (!confirm("Je, una uhakika unataka kufuta kabisa huduma hii?")) return;
    const token = localStorage.getItem("saangsm_token");
    fetch(`/api/admin/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showFeedback(data.error, true);
        else {
          showFeedback("Huduma imefutwa kikamilifu!");
          loadAllData();
        }
      });
  };

  const startServiceEdit = (s: Service) => {
    setEditingServiceId(s.id);
    setServCatId(s.category_id);
    setServTitle(s.title);
    setServSlug(s.slug);
    setServDesc(s.description || "");
    setServPrice(s.price);
    setServDelivery(s.delivery_label);
    setServInputs(s.requires_input || "[]");
    setServFeatured(s.is_featured === 1);
    setServActive(s.is_active === 1);
    setServStock(s.stock);
  };

  const clearServiceForm = () => {
    setEditingServiceId(null);
    setServTitle("");
    setServSlug("");
    setServDesc("");
    setServPrice(0);
    setServDelivery("");
    setServInputs("");
    setServFeatured(false);
    setServActive(true);
    setServStock(999);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs text-gray-400 font-mono">Tunapakia workspace ya admin...</p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Panel Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-amber-500 font-mono uppercase">
            <LayoutDashboard className="h-4 w-4" />
            <span>SaanGSM Admin Controls</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans sm:text-3xl">Workspace ya Fundi Mkuu</h1>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onNavigate("home")}
            className="rounded-md border border-gray-800 bg-black px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            Tazama Site kama Mteja
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-red-900/40 bg-red-950/20 p-4 text-xs text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 p-4 text-xs text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="border-b border-gray-900 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "stats" ? "border-amber-500 text-amber-500" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Muhtasari & KPI
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "orders" ? "border-amber-500 text-amber-500" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Oda Zote ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "services" ? "border-amber-500 text-amber-500" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Manage Huduma ({services.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "categories" ? "border-amber-500 text-amber-500" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Kategoria ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "customers" ? "border-amber-500 text-amber-500" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Wateja/Users ({customers.length})
        </button>
      </div>

      {/* TAB CONTENT: STATS */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8 animate-fadeIn">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg flex items-center space-x-4">
              <div className="h-10 w-10 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center justify-center text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Jumla ya Mapato</span>
                <span className="block font-mono text-xl font-bold text-white">
                  {stats.total_revenue.toLocaleString()} <span className="text-[10px]">TZS</span>
                </span>
              </div>
            </div>

            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg flex items-center space-x-4">
              <div className="h-10 w-10 bg-amber-950/20 border border-amber-900/40 rounded flex items-center justify-center text-amber-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Jumla ya Wateja</span>
                <span className="block font-mono text-xl font-bold text-white">{stats.customers_count}</span>
              </div>
            </div>

            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-950/20 border border-blue-900/40 rounded flex items-center justify-center text-blue-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Oda Zinazofanyiwa Kazi</span>
                <span className="block font-mono text-xl font-bold text-white">
                  {orders.filter(o => o.status === "processing").length}
                </span>
              </div>
            </div>

            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg flex items-center space-x-4">
              <div className="h-10 w-10 bg-red-950/20 border border-red-900/40 rounded flex items-center justify-center text-red-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-sans">Oda Zinazosubiri Malipo</span>
                <span className="block font-mono text-xl font-bold text-white">
                  {orders.filter(o => o.status === "pending_payment").length}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="border border-gray-800 bg-black/60 p-5 rounded-lg space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans border-b border-gray-900 pb-2">Oda za Hivi Karibuni</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-wider font-mono text-[9px]">
                    <th className="py-2.5">Oda Ref</th>
                    <th className="py-2.5">Mteja</th>
                    <th className="py-2.5">Huduma</th>
                    <th className="py-2.5">Jumla</th>
                    <th className="py-2.5">Hali (Status)</th>
                    <th className="py-2.5">Muda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 font-sans text-gray-300">
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-950/40">
                      <td className="py-3 font-mono font-bold text-amber-500">{o.order_ref}</td>
                      <td className="py-3">{o.customer_name}</td>
                      <td className="py-3 font-medium text-white">{o.service_title}</td>
                      <td className="py-3 font-mono font-bold text-emerald-400">{o.total_amount.toLocaleString()} TZS</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          o.status === "completed" ? "bg-emerald-950/40 text-emerald-400" :
                          o.status === "processing" ? "bg-blue-950/25 text-blue-400" :
                          o.status === "pending_payment" ? "bg-amber-950/20 text-amber-400" : "bg-gray-900 text-gray-500"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-[10px] text-gray-500 font-mono">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Orodha ya Oda Zote Zilizowekwa</h3>
          </div>

          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isRental = order.service_type === "rental";
              let inputsObj: Record<string, string> = {};
              if (order.customer_input) {
                try {
                  inputsObj = JSON.parse(order.customer_input);
                } catch (e) {}
              }

              return (
                <div key={order.id} className="border border-gray-800 bg-gray-950/40 rounded-lg overflow-hidden">
                  {/* Order header row */}
                  <div
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedOrderId(null);
                      } else {
                        setExpandedOrderId(order.id);
                        startOrderEdit(order);
                      }
                    }}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-black/20"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-black border border-gray-900 rounded flex items-center justify-center shrink-0">
                        {isRental ? <Key className="h-4.5 w-4.5 text-blue-400" /> : <Smartphone className="h-4.5 w-4.5 text-amber-500" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <h4 className="text-xs font-bold text-white leading-tight">{order.service_title}</h4>
                          <span className="text-[10px] font-mono text-amber-500 font-bold">{order.order_ref}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Mteja: <span className="font-bold text-gray-300">{order.customer_name}</span> ({order.customer_phone})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-x-4">
                      <div className="text-right">
                        <span className="block font-mono text-xs font-bold text-emerald-400">{order.total_amount.toLocaleString()} TZS</span>
                        <span className="block text-[10px] text-gray-500 font-mono">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                          order.status === "completed" ? "bg-emerald-950/40 text-emerald-400" :
                          order.status === "processing" ? "bg-blue-950/25 text-blue-400" :
                          order.status === "pending_payment" ? "bg-amber-950/20 text-amber-400" : "bg-gray-900 text-gray-500"
                        }`}>
                          {order.status}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Admin Action Form */}
                  {isExpanded && (
                    <div className="border-t border-gray-900 bg-black/90 p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-900 pb-4">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Taarifa za Mteja & Data</h5>
                          <div className="bg-gray-950 p-4 rounded border border-gray-900 text-xs space-y-1.5">
                            <div>Mteja: <span className="text-white font-bold">{order.customer_name}</span></div>
                            <div>Barua pepe: <span className="text-white font-mono">{order.customer_email}</span></div>
                            <div>Namba ya simu: <span className="text-white font-mono">{order.customer_phone}</span></div>
                            <div className="pt-2 border-t border-gray-900 space-y-1">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase">Maelezo Aliyoweka:</span>
                              {Object.entries(inputsObj).map(([key, val]) => (
                                <div key={key} className="flex justify-between font-mono text-[11px]">
                                  <span className="text-gray-500">{key}:</span>
                                  <span className="text-amber-400 font-bold">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Taarifa za Oda & Timing</h5>
                          <div className="bg-gray-950 p-4 rounded border border-gray-900 text-xs space-y-1.5">
                            <div>Rejea Code: <span className="text-amber-500 font-mono font-bold">{order.order_ref}</span></div>
                            <div>Gharama ya Unit: <span className="text-white font-mono">{order.unit_price.toLocaleString()} TZS</span></div>
                            <div>Kiasi cha Oda: <span className="text-white font-bold">{order.quantity}</span></div>
                            <div>Muda wa Kazi: <span className="text-white font-bold">{order.delivery_label}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Action forms */}
                      <form onSubmit={(e) => handleUpdateOrder(e, order.id)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400">Sasisha Hali ya Kazi (Status)</label>
                            <select
                              value={orderStatus}
                              onChange={(e) => setOrderStatus(e.target.value)}
                              className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 focus:border-amber-500 focus:outline-hidden"
                            >
                              <option value="pending_payment">Pending Payment</option>
                              <option value="paid">Paid (Malipo Yamepokelewa)</option>
                              <option value="processing">Processing (Inashughulikiwa)</option>
                              <option value="completed">Completed (Imekamilika)</option>
                              <option value="failed">Failed (Imefeli)</option>
                              <option value="cancelled">Cancelled (Umeghairi)</option>
                              <option value="refunded">Refunded (Kurudisha hela)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-400">Mrejesho wa Mteja (Admin Notes)</label>
                            <input
                              type="text"
                              value={orderAdminNotes}
                              onChange={(e) => setOrderAdminNotes(e.target.value)}
                              placeholder="Mfano: FRP bypassed successfully! / Token imesasishwa."
                              className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 focus:border-amber-500 focus:outline-hidden font-mono"
                            />
                          </div>
                        </div>

                        {/* Access credentials insertion for rentals or auto activations */}
                        {isRental && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-blue-400">Inject/Update logins za Tool (Rentals Credentials)</label>
                            <textarea
                              rows={3}
                              value={orderAccessCreds}
                              onChange={(e) => setOrderAccessCreds(e.target.value)}
                              placeholder="Weka logins details zitakazoonekana kwa mteja mara moja. Zitaonekana kwenye akaunti yake kwa JetBrains Mono font."
                              className="w-full rounded border border-gray-850 bg-black p-3 text-xs text-gray-200 focus:border-amber-500 focus:outline-hidden font-mono"
                            />
                            <span className="block text-[9px] text-gray-500">
                              Taarifa hizi zitaingia kwenye database na mteja ataweza kuziona na kuzi-copy ili afungue UnlockTool au DFT Pro kwenye mashine yake.
                            </span>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            id={`save-order-btn-${order.id}`}
                            className="inline-flex items-center space-x-1 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Hifadhi Mabadiliko ya Oda</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SERVICES */}
      {activeTab === "services" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Left Column: List Services */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Orodha ya Huduma Zilizopo</h3>
            
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="border border-gray-800 bg-gray-950 p-4 rounded-lg flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white leading-snug">{s.title}</h4>
                      {s.is_featured === 1 && (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.2 text-[8px] font-bold text-amber-500 font-mono">FEATURED</span>
                      )}
                      {s.is_active === 0 && (
                        <span className="rounded-full bg-red-950/20 border border-red-900/30 px-2 py-0.2 text-[8px] font-bold text-red-500 font-mono">SUSPENDED</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-2">
                      <span>Cat: {s.category_name}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{s.price.toLocaleString()} TZS</span>
                      <span>•</span>
                      <span>Muda: {s.delivery_label}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => startServiceEdit(s)}
                      title="Edit"
                      className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-amber-500 transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      title="Futa"
                      className="p-1.5 rounded bg-red-950/20 text-red-400 hover:bg-red-950 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Add / Edit form */}
          <div className="lg:col-span-5">
            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-gray-900 pb-2">
                {editingServiceId ? `Hariri Huduma ID #${editingServiceId}` : "Ongeza Huduma Mpya"}
              </h3>

              <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                {/* Category ID */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Kategoria ya Huduma</label>
                  <select
                    value={servCatId}
                    onChange={(e) => setServCatId(Number(e.target.value))}
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Jina la Huduma</label>
                  <input
                    type="text"
                    value={servTitle}
                    onChange={(e) => setServTitle(e.target.value)}
                    placeholder="Mfano: UnlockTool Activation - Miezi 6"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Slug (URL Name)</label>
                  <input
                    type="text"
                    value={servSlug}
                    onChange={(e) => setServSlug(e.target.value)}
                    placeholder="Mfano: unlocktool-activation-6months"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 font-mono"
                    required
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Bei (TZS)</label>
                  <input
                    type="number"
                    value={servPrice}
                    onChange={(e) => setServPrice(Number(e.target.value))}
                    placeholder="Mfano: 85000"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 font-mono"
                    required
                  />
                </div>

                {/* Delivery timing */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Muda wa Kazi (Delivery Label)</label>
                  <input
                    type="text"
                    value={servDelivery}
                    onChange={(e) => setServDelivery(e.target.value)}
                    placeholder="Mfano: Dakika 10 - 20 au Papo hapo"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Maelezo ya Huduma</label>
                  <textarea
                    rows={3}
                    value={servDesc}
                    onChange={(e) => setServDesc(e.target.value)}
                    placeholder="Eleza kwa makini huduma hii inafanyaje kazi..."
                    className="w-full rounded border border-gray-850 bg-black p-2.5 text-xs text-gray-200"
                  />
                </div>

                {/* Custom Fields configuration */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-blue-400">Custom Input Requirements JSON</label>
                  <textarea
                    rows={3}
                    value={servInputs}
                    onChange={(e) => setServInputs(e.target.value)}
                    placeholder='Mfano: [{"name":"imei","label":"IMEI (Namba 15)","type":"text","required":true}]'
                    className="w-full rounded border border-gray-850 bg-black p-2.5 text-xs text-gray-200 font-mono"
                  />
                  <span className="block text-[9px] text-gray-500">
                    Jaza valid JSON array ya field za uwanja ambazo mteja atazijaza mfano IMEI au Serial. Weka [] kama haihitaji uwanja wowote.
                  </span>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={servFeatured}
                      onChange={(e) => setServFeatured(e.target.checked)}
                      className="rounded bg-black border-gray-800 text-amber-500"
                    />
                    <span className="text-[11px] text-gray-300">Weka Featured (Home)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={servActive}
                      onChange={(e) => setServActive(e.target.checked)}
                      className="rounded bg-black border-gray-800 text-emerald-500"
                    />
                    <span className="text-[11px] text-gray-300">Inatumika (Active)</span>
                  </label>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={clearServiceForm}
                      className="rounded border border-gray-800 bg-transparent px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Ghairi
                    </button>
                  )}
                  <button
                    type="submit"
                    id="save-service-submit-btn"
                    className="rounded bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                  >
                    {editingServiceId ? "Hifadhi Huduma" : "Ongeza Huduma"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Left list categories */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Orodha ya Kategoria za Huduma</h3>
            
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="border border-gray-800 bg-gray-950 p-4 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white leading-tight">{c.name}</h4>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Slug: <span className="text-gray-400 font-bold">{c.slug}</span> | Aina: <span className="text-amber-500 uppercase">{c.type}</span>
                    </div>
                  </div>

                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => startCategoryEdit(c)}
                      className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-amber-500 transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 rounded bg-red-950/20 text-red-400 hover:bg-red-950 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Category Form */}
          <div className="lg:col-span-5">
            <div className="border border-gray-800 bg-gray-950 p-5 rounded-lg space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-gray-900 pb-2">
                {editingCategoryId ? "Hariri Kategoria" : "Ongeza Kategoria Mpya"}
              </h3>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Jina la Kategoria</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Mfano: IMEI Unlocking Services"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Slug (URL Identifier)</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="Mfano: imei-unlocking-services"
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 font-mono"
                    required
                  />
                </div>

                {/* Category Type */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Aina ya Kategoria (Type)</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as any)}
                    className="w-full rounded border border-gray-850 bg-black py-2 px-3 text-xs text-gray-200 font-mono"
                    required
                  >
                    <option value="imei">imei (IMEI/Serial operations)</option>
                    <option value="server">server (Activations / Server logs)</option>
                    <option value="rental">rental (Hourly / Daily Tool rentals)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-400">Maelezo fupi</label>
                  <textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Eleza kategoria hii kwa Kiswahili..."
                    className="w-full rounded border border-gray-850 bg-black p-2.5 text-xs text-gray-200"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={clearCategoryForm}
                      className="rounded border border-gray-800 bg-transparent px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Ghairi
                    </button>
                  )}
                  <button
                    type="submit"
                    className="rounded bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                  >
                    {editingCategoryId ? "Hifadhi Kategoria" : "Ongeza Kategoria"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="border border-gray-800 bg-black/60 p-5 rounded-lg space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans border-b border-gray-900 pb-2">Dhibiti Akaunti za Wateja (Users Management)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-wider font-mono text-[9px]">
                  <th className="py-2.5">Mteja ID</th>
                  <th className="py-2.5">Jina Kamili</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Namba ya Simu</th>
                  <th className="py-2.5">Role (Cheo)</th>
                  <th className="py-2.5">Hali (Status)</th>
                  <th className="py-2.5 text-right">Dhibiti Kitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900 text-gray-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-950/30">
                    <td className="py-3 font-mono font-bold text-gray-500">#{c.id}</td>
                    <td className="py-3 font-medium text-white">{c.name}</td>
                    <td className="py-3 font-mono text-gray-400">{c.email}</td>
                    <td className="py-3 font-mono text-gray-400">{c.phone}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                        c.role === "admin" ? "bg-amber-950/20 text-amber-400 border border-amber-900/45" : "bg-gray-900 text-gray-400"
                      }`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {c.is_active === 1 ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 font-semibold flex items-center space-x-1">
                          <X className="h-3 w-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {c.role === "admin" ? (
                        <span className="text-[10px] text-gray-600">Admin Hawezi Blockiwa</span>
                      ) : (
                        <button
                          onClick={() => handleToggleCustomer(c.id)}
                          className={`cursor-pointer inline-flex items-center space-x-1 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            c.is_active === 1
                              ? "bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-950"
                              : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950"
                          }`}
                        >
                          {c.is_active === 1 ? (
                            <>
                              <ToggleRight className="h-3.5 w-3.5" />
                              <span>Simamisha (Block)</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3.5 w-3.5" />
                              <span>Fungua (Unblock)</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
