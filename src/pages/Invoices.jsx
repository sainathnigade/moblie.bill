import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import InvoiceModal from "../components/InvoiceModal";
import { 
  Search, 
  Trash2, 
  Eye, 
  Calendar,
  Filter,
  FileSpreadsheet
} from "lucide-react";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Invoices() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const bls = await dbService.getBills();
      const sets = await dbService.getSettings();
      setBills(bls);
      setSettings(sets);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteInvoice = async (id, billNo) => {
    if (!confirm(`Are you absolutely sure you want to delete invoice ${billNo}? This cannot be undone.`)) return;

    await dbService.deleteBill(id);
    setBills(prev => prev.filter(b => b.id !== id));
    toast(`Invoice ${billNo} successfully deleted from the records.`, "success");
  };

  const filteredBills = bills.filter(b => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();

    if (searchType === "billNo") return b.billNo.toLowerCase().includes(query);
    if (searchType === "customer") return b.customer.name.toLowerCase().includes(query) || b.customer.phone.includes(query);
    if (searchType === "imei") return b.products.some(p => (p.imei || "").toLowerCase().includes(query));
    
    // 'all' search
    return b.billNo.toLowerCase().includes(query) || 
      b.customer.name.toLowerCase().includes(query) || 
      b.customer.phone.includes(query) ||
      b.products.some(p => (p.imei || "").toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        <span>Loading Invoices...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">Invoice Registry</h2>
          <div className="text-xs text-gray-400 dark:text-text3 mt-1.5">Review and manage all compiled store bills</div>
        </div>
      </div>

      {/* Query Search panel */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
            <input 
              type="text" 
              placeholder="Search old invoices by IMEI, customer phone, name, or bill number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 placeholder-text3"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            <Filter className="w-4 h-4 text-text3" />
            <span className="text-xs text-text2 font-bold uppercase tracking-wider">Filter By:</span>
            <select 
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100 font-semibold"
            >
              <option value="all">All Metadata</option>
              <option value="billNo">Bill Number</option>
              <option value="customer">Customer details</option>
              <option value="imei">IMEI / Serial</option>
            </select>
          </div>
        </div>

        {/* Audit data table */}
        <div className="overflow-x-auto border border-gray-100 dark:border-darkBorder rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkSurface2 border-b border-gray-100 dark:border-darkBorder">
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Bill ID</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Client Profiles</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Purchased Items</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Tax & Discount</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Gross Payable</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-gray-400 dark:text-text3">
                    No matching invoices found in local database registry.
                  </td>
                </tr>
              ) : (
                filteredBills.map(b => (
                  <tr key={b.id} className="border-b border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkSurface2">
                    <td className="p-4">
                      <div className="font-bold text-sm text-primary">{b.billNo}</div>
                      <div className="text-[10px] text-gray-400 dark:text-text3 mt-1 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-text3" /> {fmtDate(b.date)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{b.customer.name}</div>
                      <div className="text-xs text-gray-400 dark:text-text2 mt-1">📞 {b.customer.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {b.products.map((p, idx) => (
                          <div key={idx} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            • {p.name} <span className="text-gray-400 dark:text-text3 text-[10px]">({p.qty}x)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-500 dark:text-text2">GST: <b>{fmt(b.gst)}</b></div>
                      <div className="text-xs text-danger mt-1">Disc: <b>-{fmt(b.discount)}</b></div>
                    </td>
                    <td className="p-4 font-black text-sm text-success">
                      {fmt(b.total)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedBill(b)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(b.id, b.billNo)}
                          className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && (
        <InvoiceModal 
          bill={selectedBill} 
          settings={settings}
          onClose={() => setSelectedBill(null)} 
        />
      )}
    </div>
  );
}
