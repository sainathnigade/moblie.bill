import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { 
  TrendingUp, 
  Calendar, 
  Receipt, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Dashboard({ user, setPage }) {
  const [bills, setBills] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const bls = await dbService.getBills();
        const inv = await dbService.getInventory();
        setBills(bls);
        setInventory(inv);
      } catch (err) {
        console.error("Data load error:", err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        <span>Loading stats...</span>
      </div>
    );
  }

  const todayStr = new Date().toDateString();
  const todayBills = bills.filter(b => new Date(b.date).toDateString() === todayStr);

  const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
  const todaySales = todayBills.reduce((sum, b) => sum + b.total, 0);
  const lowStock = inventory.filter(p => p.qty <= p.lowStockAlert);

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      {/* Dynamic Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-primary" />
          <div className="flex justify-between items-center text-gray-500 dark:text-text2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-black font-head text-gray-900 dark:text-gray-100 mt-2">
            {fmt(totalSales)}
          </div>
          <div className="text-[10px] font-bold text-success mt-2 flex items-center gap-1">
            ↑ Accumulated gross total
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-emerald-500" />
          <div className="flex justify-between items-center text-gray-500 dark:text-text2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <Calendar className="w-5 h-5 text-success" />
          </div>
          <div className="text-2xl font-black font-head text-gray-900 dark:text-gray-100 mt-2">
            {fmt(todaySales)}
          </div>
          <div className="text-[10px] font-bold text-success mt-2 flex items-center gap-1">
            ↑ {todayBills.length} invoices generated today
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-accent" />
          <div className="flex justify-between items-center text-gray-500 dark:text-text2">
            <span className="text-xs font-semibold uppercase tracking-wider">Invoices Issued</span>
            <Receipt className="w-5 h-5 text-warning" />
          </div>
          <div className="text-2xl font-black font-head text-gray-900 dark:text-gray-100 mt-2">
            {bills.length}
          </div>
          <div className="text-[10px] font-bold text-success mt-2 flex items-center gap-1">
            ↑ Audit transaction logs
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
          <div className="flex justify-between items-center text-gray-500 dark:text-text2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Units</span>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-black font-head text-gray-900 dark:text-gray-100 mt-2">
            {inventory.reduce((acc, p) => acc + p.qty, 0)}
          </div>
          <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${
            lowStock.length > 0 ? "text-danger" : "text-success"
          }`}>
            {lowStock.length > 0 ? `⚠️ ${lowStock.length} items low stock` : "✓ Warehouse stocks stable"}
          </div>
        </div>
      </div>

      {/* Low stock Alert strip */}
      {lowStock.length > 0 && (
        <div className="flex gap-3 bg-red-500/5 border border-danger/25 p-4 rounded-xl text-danger">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Inventory Threshold Limit warning:</span> The following models require immediate restocking replenishment: {
              lowStock.map(p => `${p.name} (${p.qty} left)`).join(", ")
            }.
          </div>
        </div>
      )}

      {/* Main Dual column panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent bills */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-darkBorder">
            <h3 className="font-head text-sm font-bold flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-primary" /> Recent Invoices
            </h3>
            <button 
              onClick={() => setPage("history")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentBills.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-text3">No bills generated yet in system.</div>
            ) : (
              recentBills.map(b => (
                <div 
                  key={b.id} 
                  className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-darkSurface2 border border-gray-100 dark:border-darkBorder rounded-xl transition-all hover:scale-[1.005]"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{b.billNo}</div>
                    <div className="text-xs text-gray-400 dark:text-text3 mt-1 truncate">
                      {b.customer.name} · {fmtDate(b.date)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-primary">{fmt(b.total)}</div>
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-success/10 text-success px-1.5 py-0.5 rounded-full mt-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> PAID
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Stock Indicator list */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-darkBorder">
            <h3 className="font-head text-sm font-bold flex items-center gap-2">
              <Package className="w-4.5 h-4.5 text-success" /> Stock Level Analytics
            </h3>
            <button 
              onClick={() => setPage("inventory")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {inventory.slice(0, 5).map(p => {
              const maxRange = Math.max(p.qty, p.lowStockAlert * 3);
              const percent = Math.min(100, (p.qty / maxRange) * 100);
              const isLow = p.qty <= p.lowStockAlert;

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-900 dark:text-gray-100">
                      {p.name} <span className="text-gray-400 dark:text-text3 text-[10px] font-bold">({p.brand})</span>
                    </span>
                    <span className={isLow ? "text-danger font-bold" : "text-gray-500 dark:text-text2"}>
                      {p.qty} units left {isLow ? "⚠️" : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-darkBorder rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full progress-fill ${
                        isLow ? "bg-gradient-to-r from-danger to-rose-400" : "bg-gradient-to-r from-primary to-accent"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
