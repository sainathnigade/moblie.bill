import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import { Search, Tag, MessageSquare, Phone, User, LogIn, Laptop, Smartphone, HelpCircle } from "lucide-react";

export default function Storefront({ onOpenLogin }) {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [loading, setLoading] = useState(true);
  
  // Enquiry Modal States
  const [activeProduct, setActiveProduct] = useState(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custMessage, setCustMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await dbService.getInventory();
      setInventory(data);
      setLoading(false);
    }
    load();
  }, []);

  const brands = ["All", ...new Set(inventory.map(p => p.brand))];

  const filtered = inventory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.model.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      toast("Please fill in your name and phone number.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await dbService.saveEnquiry({
        customerName: custName,
        customerPhone: custPhone,
        productName: activeProduct.name,
        brand: activeProduct.brand,
        model: activeProduct.model,
        message: custMessage,
        date: new Date().toISOString(),
        status: "Pending"
      });
      toast(`Enquiry for ${activeProduct.name} submitted! We will contact you soon.`, "success");
      // Reset
      setActiveProduct(null);
      setCustName("");
      setCustPhone("");
      setCustMessage("");
    } catch (err) {
      toast("Failed to submit enquiry. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-gray-100 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#0c0c12]/80 backdrop-blur-xl border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-black font-head bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            📱 Shree Mobile Storefront
          </span>
          <span className="hidden sm:inline-flex bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
            Live Showcase
          </span>
        </div>
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#171725] to-[#1c1c30] hover:from-primary hover:to-primary/80 text-xs font-bold rounded-xl border border-gray-800 hover:border-transparent text-gray-200 hover:text-white transition-all shadow-md"
        >
          <LogIn className="w-3.5 h-3.5" /> Staff ERP Portal
        </button>
      </header>

      {/* Hero Showcase Section */}
      <section className="relative px-6 py-12 md:py-20 text-center overflow-hidden border-b border-gray-900/50 bg-radial-at-t from-primary/10 via-transparent to-transparent">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative space-y-4">
          <h1 className="text-3xl md:text-5xl font-black font-head leading-tight text-white">
            Browse Our <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Live Stock Inventory</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto font-medium">
            Explore authentic devices, check specs & instantly send purchase enquiries directly to our retail representatives! No login required.
          </p>
        </div>
      </section>

      {/* Filters & Product Catalogue */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0c0c14] p-5 rounded-2xl border border-gray-900">
          {/* Search box */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by brand, model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-[#131320] border border-gray-800 rounded-xl text-sm outline-none focus:border-primary transition-all w-full text-white placeholder-gray-500"
            />
          </div>

          {/* Brand pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedBrand === brand
                    ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20"
                    : "bg-[#131320] text-gray-400 border-gray-800 hover:text-white"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
            Loading live showcase catalogue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-500 bg-[#0c0c14] rounded-2xl border border-gray-900">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-bold">No models match your search criteria.</p>
            <p className="text-xs text-gray-600 mt-1">Please try searching another device or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
              const outOfStock = p.qty <= 0;
              return (
                <div
                  key={p.id}
                  className="bg-[#0c0c14] border border-gray-900 hover:border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px] flex flex-col justify-between shadow-lg relative group overflow-hidden"
                >
                  {/* Decorative background glow on hover */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-[#171726] text-primary text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase border border-primary/10">
                        {p.brand}
                      </span>
                      {outOfStock ? (
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                          {p.qty} Available
                        </span>
                      )}
                    </div>

                    <h3 className="font-head text-lg font-bold text-white mb-2 leading-tight">{p.name}</h3>
                    
                    {/* Device Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 mb-6 bg-[#131320]/50 p-3 rounded-xl border border-gray-900/50">
                      <div>📁 <span className="font-semibold text-gray-300">Storage:</span> {p.storage || "N/A"}</div>
                      <div>⚡ <span className="font-semibold text-gray-300">RAM:</span> {p.ram || "N/A"}</div>
                      <div>🎨 <span className="font-semibold text-gray-300">Color:</span> {p.color || "N/A"}</div>
                      <div>🏷️ <span className="font-semibold text-gray-300">Model:</span> {p.model || "N/A"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated Price</span>
                      <span className="text-xl font-black font-head text-primary">
                        ₹{Number(p.price || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveProduct(p)}
                      className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/95 hover:to-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Enquire Stock Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#050508] border-t border-gray-900 py-8 px-6 text-center text-xs text-gray-500 space-y-2">
        <p>© 2026 Shree Mobile Retails. All specifications are dynamic and subject to physical shop validation.</p>
        <p className="text-[10px] text-gray-600">Premium Point of Sale & Client Showcase Portal ERP</p>
      </footer>

      {/* Enquiry Form Glassmorphism Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c0c14] border border-gray-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
            
            <h3 className="font-head text-lg font-black text-white mb-1 flex items-center gap-2">
              📝 Submit Stock Enquiry
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Enter your details. Our Shree Mobile executive will contact you shortly.
            </p>

            <div className="bg-[#131320] border border-gray-900 p-4 rounded-2xl mb-5 space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Requested Model</span>
              <div className="font-bold text-white text-sm">{activeProduct.name}</div>
              <div className="text-[11px] text-gray-500 font-mono">
                {activeProduct.brand} · {activeProduct.model} ({activeProduct.color}, {activeProduct.ram}/{activeProduct.storage})
              </div>
            </div>

            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name..."
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#131320] border border-gray-800 rounded-xl text-sm outline-none focus:border-primary w-full text-white placeholder-gray-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" /> Contact Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit phone number..."
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#131320] border border-gray-800 rounded-xl text-sm outline-none focus:border-primary w-full text-white placeholder-gray-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-primary" /> Custom Request (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Do you have color options? Best price details?"
                  value={custMessage}
                  onChange={e => setCustMessage(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#131320] border border-gray-800 rounded-xl text-sm outline-none focus:border-primary w-full text-white placeholder-gray-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveProduct(null)}
                  className="flex-1 py-3 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center"
                >
                  {submitting ? "Sending..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
