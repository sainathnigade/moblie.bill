import { useState, useEffect } from "react";
import { ToastContainer, toast } from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";
import Warranty from "./pages/Warranty";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Storefront from "./pages/Storefront";
import Enquiries from "./pages/Enquiries";
import { dbService } from "./dbService";
import {
  LayoutDashboard,
  Receipt,
  History,
  Package,
  SearchCode,
  Users,
  Settings as SettingsIcon,
  TrendingUp,
  Sun,
  Moon,
  Menu,
  MessageSquare
} from "lucide-react";

const PAGE_TITLES = {
  dashboard: { icon: LayoutDashboard, label: "Analytics Dashboard" },
  billing:   { icon: Receipt, label: "Quick Point Of Sale" },
  history:   { icon: History, label: "Invoice Audit Registry" },
  reports:   { icon: TrendingUp, label: "Business Intelligence Reports" },
  inventory: { icon: Package, label: "Warehouse Stock Levels" },
  warranty:  { icon: SearchCode, label: "IMEI & Warranty Auditor" },
  enquiries: { icon: MessageSquare, label: "Live Customer Enquiries" },
  customers: { icon: Users, label: "Client Profiles Database" },
  settings:  { icon: SettingsIcon, label: "System Configuration" }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("mhpro_theme") || "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.remove("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }
    localStorage.setItem("mhpro_theme", theme);
  }, [theme]);

  // Sync in-app page selection with browser history
  useEffect(() => {
    const currentStatePage = window.history.state?.page;
    if (currentStatePage && currentStatePage !== page) {
      setPage(currentStatePage);
    } else {
      window.history.replaceState({ page }, "", `#${page}`);
    }

    const handlePopState = (event) => {
      if (event.state?.page) {
        setPage(event.state.page);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (window.history.state?.page !== page) {
      window.history.pushState({ page }, "", `#${page}`);
    }
  }, [page]);

  // Load low stock count for sidebar badge
  useEffect(() => {
    async function checkStock() {
      const inventory = await dbService.getInventory();
      setLowStockCount(inventory.filter(p => p.qty <= p.lowStockAlert).length);
    }
    if (user) checkStock();
  }, [user, page]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      setUser(null);
      setPage("dashboard");
      toast("Signed out of session.", "info");
    }
  };

  const handleDataImport = () => setPage("dashboard");

  // Not authenticated — show storefront catalog by default
  if (!user) {
    return (
      <>
        {showLogin ? (
          <Login onLogin={(u) => { setUser(u); setShowLogin(false); }} onCancel={() => setShowLogin(false)} />
        ) : (
          <Storefront onOpenLogin={() => setShowLogin(true)} />
        )}
        <ToastContainer />
      </>
    );
  }

  const currentPageInfo = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
  const PageIcon = currentPageInfo.icon;

  return (
    <>
      {/* Sidebar */}
      <Sidebar
        user={user}
        page={page}
        setPage={setPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
      />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[250px] bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-6 gap-4 shadow-sm backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-text2 hover:bg-gray-100 dark:hover:bg-darkSurface2 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 flex-1">
            <PageIcon className="w-5 h-5 text-primary" />
            <h1 className="font-head text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {currentPageInfo.label}
            </h1>
          </div>

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Page Content Router */}
        <main className="flex-1 flex flex-col">
          {page === "dashboard" && <Dashboard user={user} setPage={setPage} />}
          {page === "billing" && <Billing />}
          {page === "history" && <Invoices />}
          {page === "reports" && <Reports />}
          {page === "inventory" && <Inventory user={user} />}
          {page === "warranty" && <Warranty />}
          {page === "enquiries" && <Enquiries />}
          {page === "customers" && <Customers />}
          {page === "settings" && <Settings onDataImport={handleDataImport} />}
        </main>
      </div>

      <ToastContainer />
    </>
  );
}
