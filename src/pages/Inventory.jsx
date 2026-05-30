import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet,
  AlertTriangle,
  FolderOpen
} from "lucide-react";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const INITIAL_FORM = { name: "", brand: "", model: "", color: "", ram: "8GB", storage: "256GB", qty: 0, price: "", costPrice: "", gst: 18, lowStockAlert: 2 };

export default function Inventory({ user }) {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const inv = await dbService.getInventory();
      setItems(inv);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim() || !form.price) {
      toast("Form validation failed. Review name, brand, and retail price.", "error");
      return;
    }

    const saved = await dbService.saveInventoryItem(form);
    
    setItems(prev => {
      const idx = prev.findIndex(item => item.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    toast("Stock inventory item successfully saved.", "success");
    setModalOpen(false);
  };

  const handleDeleteStock = async (id, name) => {
    if (!confirm(`Are you absolutely sure you want to delete product record: ${name}?`)) return;

    await dbService.deleteInventoryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast("Stock record deleted.", "success");
  };

  const handleExcelExport = () => {
    if (!window.XLSX) {
      toast("SheetJS Excel SDK not loaded. Try again in a moment.", "error");
      return;
    }
    
    const excelRows = items.map((p, idx) => ({
      "S.No": idx + 1,
      "Product ID": p.id,
      "Product Name": p.name,
      "Brand": p.brand,
      "Model": p.model,
      "Color Spec": p.color,
      "RAM Spec": p.ram,
      "Storage Spec": p.storage,
      "Stock Reserve (Units)": p.qty,
      "Retail Price (₹)": p.price,
      "Wholesale Cost Price (₹)": user.role === "admin" ? (p.costPrice || "N/A") : "RESTRICTED",
      "GST rate (%)": p.gst,
      "Low Stock Trigger Alert": p.lowStockAlert
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(excelRows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Stock");
    
    // Auto fit column widths
    worksheet["!cols"] = [{wch: 6}, {wch: 12}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 20}];

    window.XLSX.writeFile(workbook, "Shree_Mobile_Warehouse_Stock.xlsx");
    toast("Stock spreadsheet downloaded successfully!", "success");
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.brand.toLowerCase().includes(search.toLowerCase()) ||
    item.model.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        <span>Loading Inventory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">Stock Inventory Manager</h2>
          <div className="text-xs text-gray-400 dark:text-text3 mt-1.5">Control warehouse device reserves, pricing margins, and low stock alarms</div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-success/15 hover:bg-success/25 text-success font-bold text-sm rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Stock XLS
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Create Stock Entry
          </button>
        </div>
      </div>

      {/* Database Inventory lists */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-4">
        <div className="relative w-full max-w-[400px]">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
          <input 
            type="text" 
            placeholder="Search stock by brand or model name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 placeholder-text3"
          />
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-darkBorder rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-darkSurface2 border-b border-gray-100 dark:border-darkBorder">
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Product Description</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Specs & Colors</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Stock reserves</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Acquisition Cost</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Retail Price</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Alert slab</th>
                <th className="p-4 text-xs font-bold text-text2 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-gray-400 dark:text-text3">
                    No items in inventory. Add products to display stock listings.
                  </td>
                </tr>
              ) : (
                filteredItems.map(p => {
                  const isLow = p.qty <= p.lowStockAlert;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkSurface2">
                      <td className="p-4">
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{p.name}</div>
                        <div className="text-xs text-gray-400 dark:text-text2 mt-1">
                          Brand: <b>{p.brand}</b> · Model: <b>{p.model}</b>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">RAM: <b>{p.ram}</b> / ROM: <b>{p.storage}</b></div>
                        <div className="text-[10px] text-gray-400 dark:text-text3 mt-1 font-semibold">Color: {p.color || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          p.qty === 0 ? "text-danger" : isLow ? "text-warning" : "text-gray-700 dark:text-gray-200"
                        }`}>
                          {p.qty} units {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-400 dark:text-text3">
                        {user.role === "admin" ? fmt(p.costPrice || p.price * 0.85) : "Restricted 🔒"}
                      </td>
                      <td className="p-4 font-black text-sm text-primary">
                        {fmt(p.price)}
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-400 dark:text-text2">
                        {p.lowStockAlert} units alert limit
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            title="Edit Stock"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStock(p.id, p.name)}
                            className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                            title="Delete Stock"
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

      {/* CRUD POPUP STOCK MODAL FORM */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkSurface border border-gray-200 dark:border-darkBorder rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between">
              <h3 className="font-head text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" /> {editItem ? "✏️ Edit Product Details" : "📦 Add Product to Stock"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-darkSurface2"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveStock}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Item Display Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. iPhone 15 Pro Max (Titanium Silver)"
                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Brand *</label>
                    <input 
                      type="text" 
                      required 
                      value={form.brand}
                      onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="e.g. Apple"
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Model *</label>
                    <input 
                      type="text" 
                      required 
                      value={form.model}
                      onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g. 15 Pro Max"
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">RAM spec</label>
                    <select 
                      value={form.ram} 
                      onChange={e => setForm(prev => ({ ...prev, ram: e.target.value }))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    >
                      <option>4GB</option>
                      <option>6GB</option>
                      <option>8GB</option>
                      <option>12GB</option>
                      <option>16GB</option>
                      <option>24GB</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Storage spec</label>
                    <select 
                      value={form.storage} 
                      onChange={e => setForm(prev => ({ ...prev, storage: e.target.value }))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    >
                      <option>64GB</option>
                      <option>128GB</option>
                      <option>256GB</option>
                      <option>512GB</option>
                      <option>1TB</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Color shade</label>
                    <input 
                      type="text" 
                      value={form.color}
                      onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Titanium Silver"
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">In-Stock Qty *</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={form.qty}
                      onChange={e => setForm(prev => ({ ...prev, qty: Math.max(0, Number(e.target.value)) }))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Retail Price (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={form.price}
                      onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Low Stock alert limit</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={form.lowStockAlert}
                      onChange={e => setForm(prev => ({ ...prev, lowStockAlert: Math.max(1, Number(e.target.value)) }))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Purchase cost price (₹)</label>
                    <input 
                      type="number" 
                      disabled={user.role !== "admin"}
                      value={form.costPrice}
                      onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))}
                      placeholder={user.role !== "admin" ? "ADMIN PRIVILEGE" : "0.00"}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">GST Tax slab</label>
                    <select 
                      value={form.gst} 
                      onChange={e => setForm(prev => ({ ...prev, gst: Number(e.target.value) }))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                    >
                      <option value="0">0% (Nil slab)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-darkBorder flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-darkSurface2 rounded-lg border border-gray-200 dark:border-darkBorder"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-success hover:bg-success/95 rounded-lg"
                >
                  💾 Save Product Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
