import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import { MessageCircle, Trash2, CheckCircle2, Phone, User, Search, RefreshCw, Smartphone } from "lucide-react";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadEnquiries = async () => {
    setLoading(true);
    const data = await dbService.getEnquiries();
    setEnquiries(data);
    setLoading(false);
  };

  useEffect(() => {
    const fetchEnquiries = async () => {
      setLoading(true);
      const data = await dbService.getEnquiries();
      setEnquiries(data);
      setLoading(false);
    };

    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    await dbService.updateEnquiryStatus(id, status);
    toast(`Enquiry status updated to ${status}!`, "success");
    loadEnquiries();
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this enquiry?")) {
      await dbService.deleteEnquiry(id);
      toast("Enquiry deleted successfully.", "info");
      loadEnquiries();
    }
  };

  const filtered = enquiries.filter(e => {
    const matchesSearch = e.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          e.customerPhone.includes(search) ||
                          e.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">Live Customer Enquiries</h2>
          <p className="text-xs text-gray-400 dark:text-text3 mt-1.5">Manage live stock stock checks & dynamic requests submitted from the storefront</p>
        </div>
        <button
          onClick={loadEnquiries}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Stats Quick strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 dark:text-text3 uppercase tracking-wider">Total Enquiries</div>
          <div className="text-xl font-black font-head text-primary mt-2">{enquiries.length}</div>
        </div>
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 dark:text-text3 uppercase tracking-wider">Pending Response</div>
          <div className="text-xl font-black font-head text-warning mt-2">
            {enquiries.filter(e => e.status === "Pending").length}
          </div>
        </div>
        <div className="bg-[#e8f5e9]/20 dark:bg-success/5 border border-success/10 dark:border-success/10 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-success/70 uppercase tracking-wider">Resolved Enquiries</div>
          <div className="text-xl font-black font-head text-success mt-2">
            {enquiries.filter(e => e.status === "Resolved").length}
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-[360px]">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
            <input
              type="text"
              placeholder="Search by client, phone, or model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 placeholder-text3"
            />
          </div>

          <div className="flex gap-2">
            {["All", "Pending", "Contacted", "Resolved"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === status
                    ? "bg-primary text-white border-transparent"
                    : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-darkSurface2 dark:text-text2 dark:border-darkBorder hover:text-primary"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-darkBorder rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkSurface2 border-b border-gray-100 dark:border-darkBorder">
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Submit Date</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Client Name</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Enquired Model</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Client Note</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-xs text-gray-400 dark:text-text3 animate-pulse">
                    Refreshing real-time enquiries...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-xs text-gray-400 dark:text-text3">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No customer enquiries found matching the filters.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const whatsappMsg = `*SHREE MOBILE STOREFRONT ENQUIRY*\n` +
                    `Hello ${e.customerName},\n` +
                    `Thank you for your interest in *${e.productName}*. We received your request:\n` +
                    `_"${e.message || 'No additional note'}"_\n\n` +
                    `Our product is in stock and ready! Please reply to connect.`;
                  
                  return (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkSurface2">
                      <td className="p-4 text-xs font-mono text-gray-400 dark:text-text3">
                        {fmtDate(e.date)}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" /> {e.customerName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-text3" /> +91 {e.customerPhone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm text-primary">{e.productName}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">{e.brand} · {e.model}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 dark:text-text2 max-w-[200px] truncate" title={e.message}>
                        {e.message || <span className="italic text-gray-400">"No note attached"</span>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          e.status === "Pending" ? "bg-warning/10 text-warning border border-warning/15" :
                          e.status === "Contacted" ? "bg-accent/10 text-accent border border-accent/15" :
                          "bg-success/10 text-success border border-success/15"
                        }`}>
                          {e.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {e.status !== "Resolved" && (
                            <button
                              onClick={() => handleUpdateStatus(e.id, "Resolved")}
                              title="Mark Resolved"
                              className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {e.status === "Pending" && (
                            <button
                              onClick={() => handleUpdateStatus(e.id, "Contacted")}
                              title="Mark Contacted"
                              className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={`https://wa.me/91${e.customerPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat via WhatsApp"
                            className="p-1.5 text-success/80 hover:bg-success/10 rounded-lg transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(e.id)}
                            title="Delete Enquiry"
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
