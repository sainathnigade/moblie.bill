import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { Search, MessageCircle, Users } from "lucide-react";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dbService.getCustomers();
      setCustomers(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        Loading Customers...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div>
        <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">Client Profiles Directory</h2>
        <p className="text-xs text-gray-400 dark:text-text3 mt-1.5">Index database of all registered client purchase histories</p>
      </div>

      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
        <div className="relative w-full max-w-[400px]">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
          <input
            type="text"
            placeholder="Search client by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 placeholder-text3"
          />
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-darkBorder rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkSurface2 border-b border-gray-100 dark:border-darkBorder">
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Client Name</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Phone</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Billing Address</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Total Invoices</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Lifetime Spend</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-xs text-gray-400 dark:text-text3">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No customer entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkSurface2">
                    <td className="p-4 font-bold text-sm text-gray-900 dark:text-gray-100">{c.name}</td>
                    <td className="p-4 text-xs font-mono text-gray-600 dark:text-text2">+91 {c.phone}</td>
                    <td className="p-4 text-xs text-gray-500 dark:text-text2">{c.address || "N/A"}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {c.totalBills} bills
                      </span>
                    </td>
                    <td className="p-4 font-black text-sm text-primary">{fmt(c.totalSpent)}</td>
                    <td className="p-4">
                      <a
                        href={`https://wa.me/91${c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-[11px] font-bold rounded-lg hover:bg-success/20 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
