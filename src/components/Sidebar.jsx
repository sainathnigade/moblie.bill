import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Package, 
  SearchCode, 
  Users, 
  Settings, 
  LogOut,
  TrendingUp,
  MessageSquare
} from "lucide-react";

export default function Sidebar({ user, page, setPage, sidebarOpen, setSidebarOpen, onLogout, lowStockCount }) {
  const getAvatarInitials = (name) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "MH";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Controls" },
    { id: "billing", label: "New POS Bill", icon: Receipt, section: "Controls" },
    { id: "history", label: "Invoices History", icon: History, section: "Controls" },
    { id: "reports", label: "Sales Reports", icon: TrendingUp, section: "Controls", adminOnly: true },
    
    { id: "inventory", label: "Stock Inventory", icon: Package, section: "Inventory & CRM", badge: lowStockCount > 0 ? lowStockCount : null },
    { id: "warranty", label: "IMEI Auditor", icon: SearchCode, section: "Inventory & CRM" },
    { id: "enquiries", label: "Customer Enquiries", icon: MessageSquare, section: "Inventory & CRM" },
    { id: "customers", label: "Clients Directory", icon: Users, section: "Inventory & CRM" },
    
    { id: "settings", label: "Configuration", icon: Settings, section: "Portal Settings" }
  ];

  // Group navigation items by sections
  const sections = ["Controls", "Inventory & CRM", "Portal Settings"];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-[100] w-[250px] bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 dark:bg-slate-950 dark:border-slate-800 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 bg-gradient-to-br from-sky-600 to-indigo-700 text-white rounded-br-3xl shadow-lg shadow-sky-500/10">
        <span className="font-head text-2xl font-extrabold">
          📱 Shree Mobile
        </span>
        <span className="text-[10px] tracking-[0.12em] font-bold text-sky-100 uppercase block mt-1">
          Billing Portal ERP
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {sections.map(sect => {
          const sectItems = navItems.filter(item => item.section === sect);
          return (
            <div key={sect} className="space-y-1">
              <div className="text-[11px] font-bold text-gray-400 dark:text-text3 uppercase tracking-wider px-3 py-2">
                {sect}
              </div>
              {sectItems.map(item => {
                // Hide page if adminOnly and active user is not admin
                if (item.adminOnly && user.role !== "admin") return null;

                const IconComponent = item.icon;
                const isActive = page === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-sky-50/80 text-sky-900 border-l-4 border-sky-500 shadow-sm shadow-sky-400/10 dark:bg-slate-800 dark:text-white" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 text-current flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-700/20">
            {getAvatarInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-text3 font-bold uppercase tracking-wider">
              {user.role}
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Sign Out Session"
            className="p-1.5 rounded-md text-gray-400 hover:text-danger dark:hover:text-danger hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
