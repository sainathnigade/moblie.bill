import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { SalesCharts } from "../components/SalesCharts";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "../components/Toast";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Reports() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dbService.getBills();
      setBills(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleExportSalesReport = () => {
    if (!window.XLSX) { toast("SheetJS not loaded yet.", "error"); return; }
    
    const rows = bills.map((b, idx) => ({
      "S.No": idx + 1,
      "Invoice No": b.billNo,
      "Date": new Date(b.date).toLocaleDateString("en-IN"),
      "Customer Name": b.customer.name,
      "Customer Phone": b.customer.phone,
      "Products Sold": b.products.map(p => p.name).join(", "),
      "Subtotal (₹)": b.subtotal,
      "GST (₹)": b.gst,
      "Discount (₹)": b.discount,
      "Grand Total (₹)": b.total,
      "Est. Profit (₹)": b.profit || Math.round(b.total * 0.15)
    }));

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    ws["!cols"] = [{wch:6},{wch:14},{wch:14},{wch:20},{wch:16},{wch:35},{wch:14},{wch:12},{wch:12},{wch:14},{wch:14}];
    window.XLSX.writeFile(wb, "Shree_Mobile_Sales_Report.xlsx");
    toast("Sales report exported to Excel!", "success");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        Loading Reports...
      </div>
    );
  }

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const totalProfit = bills.reduce((s, b) => s + (b.profit || b.total * 0.15), 0);
  const avgOrderValue = bills.length > 0 ? totalRevenue / bills.length : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">Business Intelligence Reports</h2>
          <p className="text-xs text-gray-400 dark:text-text3 mt-1.5">Revenue analytics, brand shares, and product performance metrics</p>
        </div>
        <button
          onClick={handleExportSalesReport}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-success/15 hover:bg-success/25 text-success font-bold text-sm rounded-xl transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Sales XLS
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-5 rounded-2xl shadow-sm text-center">
          <div className="text-xs font-bold text-gray-400 dark:text-text3 uppercase tracking-wider">Gross Revenue</div>
          <div className="text-xl font-black font-head text-primary mt-2">{fmt(totalRevenue)}</div>
        </div>
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-5 rounded-2xl shadow-sm text-center">
          <div className="text-xs font-bold text-gray-400 dark:text-text3 uppercase tracking-wider">Net Est. Profit</div>
          <div className="text-xl font-black font-head text-success mt-2">{fmt(totalProfit)}</div>
        </div>
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-5 rounded-2xl shadow-sm text-center">
          <div className="text-xs font-bold text-gray-400 dark:text-text3 uppercase tracking-wider">Avg Order Value</div>
          <div className="text-xl font-black font-head text-accent mt-2">{fmt(avgOrderValue)}</div>
        </div>
      </div>

      {/* Charts */}
      <SalesCharts bills={bills} />
    </div>
  );
}
