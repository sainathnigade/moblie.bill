import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import InvoiceModal from "../components/InvoiceModal";
import { 
  User, 
  Plus, 
  Trash2, 
  Sparkles,
  Phone,
  MapPin,
  Laptop
} from "lucide-react";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const INITIAL_PROD = { id: "", name: "", brand: "", model: "", imei: "", color: "", hsn: "", ram: "8GB", storage: "256GB", qty: 1, price: "", gst: 18, discount: 0 };

export default function Billing() {
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [products, setProducts] = useState(() => [{ ...INITIAL_PROD, _id: Math.random().toString(36).slice(2, 9) }]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [warrantyTill, setWarrantyTill] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [chequeDetails, setChequeDetails] = useState({ chequeNumber: "", chequeBank: "", chequeDate: "", chequeAccount: "", chequeIFSC: "" });

  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState({});
  const [billCounter, setBillCounter] = useState(1000);

  useEffect(() => {
    async function loadData() {
      const inv = await dbService.getInventory();
      const sets = await dbService.getSettings();
      const bills = await dbService.getBills();
      
      setInventory(inv);
      setSettings(sets);
      
      const lastBillCounter = bills.length > 0 
        ? Math.max(...bills.map(b => Number(b.billNo.replace("INV-", ""))), 1000)
        : 1000;
      setBillCounter(lastBillCounter);
    }
    loadData();
  }, []);

  const billNo = `INV-${billCounter + 1}`;

  const handleAddRow = () => {
    setProducts(prev => [...prev, { ...INITIAL_PROD, _id: Math.random().toString(36).slice(2, 9) }]);
  };

  const handleRemoveRow = (idx) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateProduct = (idx, field, val) => {
    setProducts(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSelectInventory = (idx, id) => {
    const matched = inventory.find(inv => inv.id === id);
    if (!matched) return;

    setProducts(prev => prev.map((item, i) => i === idx ? {
      ...item,
      id: matched.id,
      name: matched.name,
      brand: matched.brand,
      model: matched.model,
      color: matched.color,
      hsn: matched.hsn || "",
      ram: matched.ram || "8GB",
      storage: matched.storage || "256GB",
      price: matched.price,
      gst: matched.gst || 18,
      qty: 1
    } : item));
  };

  const getCalculatedProductDetails = (p) => {
    const price = Number(p.price) || 0;
    const qty = Number(p.qty) || 1;
    const discount = Number(p.discount) || 0;
    const subtotal = price * qty;
    const taxableAmt = Math.max(0, subtotal - discount);
    const gstAmt = (taxableAmt * (Number(p.gst) || 0)) / 100;
    return {
      subtotal,
      gstAmt,
      total: taxableAmt + gstAmt
    };
  };

  const subtotal = products.reduce((acc, p) => acc + getCalculatedProductDetails(p).subtotal, 0);
  const totalDiscount = products.reduce((acc, p) => acc + (Number(p.discount) || 0), 0);
  const totalGst = products.reduce((acc, p) => acc + getCalculatedProductDetails(p).gstAmt, 0);
  const grandTotal = subtotal - totalDiscount + totalGst;

  const handleSaveInvoice = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      toast("Please supply Customer Name and Phone Number.", "error");
      return;
    }
    if (products.some(p => !p.name.trim() || !p.price)) {
      toast("Make sure all items have a Name and Retail Price.", "error");
      return;
    }
    if (paymentMethod === "Cheque" && !chequeDetails.chequeNumber.trim()) {
      toast("Enter the cheque number for cheque payments.", "error");
      return;
    }

    // Double check stock quantity limits
    for (let p of products) {
      if (p.id) {
        const item = inventory.find(inv => inv.id === p.id);
        if (item && item.qty < p.qty) {
          toast(`Insufficient inventory for ${p.name}. Only ${item.qty} units left!`, "error");
          return;
        }
      }
    }

    const nextCounter = billCounter + 1;
    const invoiceNumber = `INV-${nextCounter}`;

    const savedProducts = products.map(p => {
      const calcs = getCalculatedProductDetails(p);
      return {
        ...p,
        subtotal: calcs.subtotal,
        gstAmt: calcs.gstAmt,
        total: calcs.total
      };
    });

    const newBill = {
      billNo: invoiceNumber,
      date: new Date().toISOString(),
      orderNumber,
      warrantyTill,
      paymentMethod,
      chequeDetails: paymentMethod === "Cheque" ? chequeDetails : null,
      notes: invoiceNotes,
      customer: { ...customer },
      products: savedProducts,
      subtotal,
      discount: totalDiscount,
      gst: totalGst,
      total: grandTotal,
      profit: grandTotal - products.reduce((sum, p) => {
        // Calculate cost base
        const matched = inventory.find(inv => inv.id === p.id);
        const cost = matched ? (matched.costPrice || matched.price * 0.85) : (Number(p.price) * 0.85);
        return sum + (cost * p.qty);
      }, 0)
    };

    // Save Bill transaction
    await dbService.saveBill(newBill);
    setBillCounter(nextCounter);

    // Deduct stock reserves
    for (let p of products) {
      if (p.id) {
        const item = inventory.find(inv => inv.id === p.id);
        if (item) {
          await dbService.saveInventoryItem({
            ...item,
            qty: Math.max(0, item.qty - Number(p.qty))
          });
        }
      }
    }

    // Save Customer profile updates
    const curCustomers = await dbService.getCustomers();
    const custIndex = curCustomers.findIndex(c => c.phone === customer.phone);
    if (custIndex >= 0) {
      const cust = curCustomers[custIndex];
      await dbService.saveCustomer({
        ...cust,
        name: customer.name,
        address: customer.address,
        totalBills: cust.totalBills + 1,
        totalSpent: cust.totalSpent + grandTotal
      });
    } else {
      await dbService.saveCustomer({
        phone: customer.phone,
        name: customer.name,
        address: customer.address,
        totalBills: 1,
        totalSpent: grandTotal
      });
    }

    // Register Warranty records
    for (let p of products) {
      if (p.imei) {
        const imeis = p.imei.split(",").map(s => s.trim()).filter(Boolean);
        for (let imeiNo of imeis) {
          await dbService.saveWarrantyRecord({
            imei: imeiNo,
            billNo: invoiceNumber,
            customerName: customer.name,
            customerPhone: customer.phone,
            productName: `${p.brand} ${p.model} (${p.color})`,
            date: new Date().toISOString(),
            durationMonths: 12
          });
        }
      }
    }

    toast(`Invoice successfully created: ${invoiceNumber}`, "success");
    
    // Reset forms
    setCustomer({ name: "", phone: "", address: "" });
    setOrderNumber("");
    setWarrantyTill("");
    setPaymentMethod("Cash");
    setChequeDetails({ chequeNumber: "", chequeBank: "", chequeDate: "", chequeAccount: "", chequeIFSC: "" });
    setInvoiceNotes("");
    setProducts([{ ...INITIAL_PROD, _id: Math.random().toString(36).slice(2, 9) }]);
    
    // Open InvoiceModal overlay
    setActiveBill(newBill);
    setShowPreview(true);

    // Reload inventory
    const updatedInventory = await dbService.getInventory();
    setInventory(updatedInventory);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">POS Checkout Terminal</h2>
          <div className="text-xs text-gray-400 dark:text-text3 mt-1.5">
            New Invoice No: <span className="text-primary font-bold">{billNo}</span> · {fmtDate(new Date())}
          </div>
        </div>
        <button 
          onClick={handleSaveInvoice}
          className="btn btn-success"
        >
          💾 Complete Transaction & Print
        </button>
      </div>

      {/* CUSTOMER INFORMATION CARD */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="font-head text-sm font-bold flex items-center gap-2 border-b border-gray-50 dark:border-darkBorder pb-3">
          <User className="w-4.5 h-4.5 text-primary" /> Client Customer Metadata
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-primary" /> Customer Name *
            </label>
            <input 
              type="text" 
              placeholder="e.g. John Doe"
              value={customer.name}
              onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3 text-primary" /> Phone Number *
            </label>
            <input 
              type="tel" 
              placeholder="10-digit mobile"
              value={customer.phone}
              onChange={e => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> Billing Address
            </label>
            <input 
              type="text" 
              placeholder="Street Address, City, Pincode"
              value={customer.address}
              onChange={e => setCustomer(prev => ({ ...prev, address: e.target.value }))}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Order Number</label>
            <input
              type="text"
              placeholder="PO / Order reference"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Warranty Till Date</label>
            <input
              type="date"
              value={warrantyTill}
              onChange={e => setWarrantyTill(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Invoice Note</label>
            <textarea
              value={invoiceNotes}
              onChange={e => setInvoiceNotes(e.target.value)}
              placeholder="Enter any description or note for the invoice"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {paymentMethod === "Cheque" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque Number</label>
              <input
                type="text"
                value={chequeDetails.chequeNumber}
                onChange={e => setChequeDetails(prev => ({ ...prev, chequeNumber: e.target.value }))}
                placeholder="e.g. 123456"
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque Bank</label>
              <input
                type="text"
                value={chequeDetails.chequeBank}
                onChange={e => setChequeDetails(prev => ({ ...prev, chequeBank: e.target.value }))}
                placeholder={settings.chequeBankName || "Enter bank name"}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque Date</label>
              <input
                type="date"
                value={chequeDetails.chequeDate}
                onChange={e => setChequeDetails(prev => ({ ...prev, chequeDate: e.target.value }))}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque IFSC / Account</label>
              <input
                type="text"
                value={chequeDetails.chequeIFSC}
                onChange={e => setChequeDetails(prev => ({ ...prev, chequeIFSC: e.target.value }))}
                placeholder={settings.chequeAccount || "IFSC or Account"}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

      </div>

      {/* ITEMS LIST ENTRY */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-darkBorder">
          <h3 className="font-head text-sm font-bold flex items-center gap-2">
            <Laptop className="w-4.5 h-4.5 text-primary" /> Items List Summary
          </h3>
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product Row
          </button>
        </div>

        {products.map((p, idx) => {
          const calcs = getCalculatedProductDetails(p);
          return (
            <div key={p._id} className="relative bg-gray-50 dark:bg-darkSurface2 border border-gray-100 dark:border-darkBorder p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-3 py-1 rounded-md">
                  <Sparkles className="w-3 h-3 text-primary" /> Item Row #{idx + 1}
                </span>
                {products.length > 1 && (
                  <button 
                    onClick={() => handleRemoveRow(idx)}
                    className="flex items-center gap-1 text-[10px] font-bold text-danger hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Row
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Select Stock Inventory</label>
                  <select 
                    onChange={e => handleSelectInventory(idx, e.target.value)} 
                    value={p.id || ""}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  >
                    <option value="">— Select Warehouse Stock —</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.qty} left @ {fmt(inv.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Product Name *</label>
                  <input 
                    type="text" 
                    value={p.name}
                    placeholder="Display name of device"
                    onChange={e => handleUpdateProduct(idx, "name", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Brand</label>
                  <input 
                    type="text" 
                    value={p.brand}
                    placeholder="e.g. Apple"
                    onChange={e => handleUpdateProduct(idx, "brand", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">HSN</label>
                  <input 
                    type="text" 
                    value={p.hsn}
                    placeholder="1234"
                    onChange={e => handleUpdateProduct(idx, "hsn", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Model</label>
                  <input 
                    type="text" 
                    value={p.model}
                    placeholder="Model specification"
                    onChange={e => handleUpdateProduct(idx, "model", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">IMEI / Serial Numbers</label>
                  <input 
                    type="text" 
                    value={p.imei}
                    placeholder="Separate multiple with commas"
                    onChange={e => handleUpdateProduct(idx, "imei", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Color shading</label>
                  <input 
                    type="text" 
                    value={p.color}
                    placeholder="Natural Titanium"
                    onChange={e => handleUpdateProduct(idx, "color", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">RAM size</label>
                  <select 
                    value={p.ram} 
                    onChange={e => handleUpdateProduct(idx, "ram", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
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
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Storage size</label>
                  <select 
                    value={p.storage} 
                    onChange={e => handleUpdateProduct(idx, "storage", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  >
                    <option>64GB</option>
                    <option>128GB</option>
                    <option>256GB</option>
                    <option>512GB</option>
                    <option>1TB</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={p.qty}
                    onChange={e => handleUpdateProduct(idx, "qty", Math.max(1, Number(e.target.value)))}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Unit Price (₹) *</label>
                  <input 
                    type="number" 
                    value={p.price}
                    placeholder="0.00"
                    onChange={e => handleUpdateProduct(idx, "price", e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">GST rate slab</label>
                  <select 
                    value={p.gst} 
                    onChange={e => handleUpdateProduct(idx, "gst", Number(e.target.value))}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  >
                    <option value="0">0% (Nil slab)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cash Discount (₹)</label>
                  <input 
                    type="number" 
                    value={p.discount}
                    placeholder="0"
                    onChange={e => handleUpdateProduct(idx, "discount", Number(e.target.value) || 0)}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary dark:bg-darkSurface dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Total calculations tags */}
              <div className="flex justify-end gap-5 text-xs text-gray-400 dark:text-text2 pt-3 border-t border-gray-200/50 dark:border-darkBorder">
                <div>Base Subtotal: <b>{fmt(calcs.subtotal)}</b></div>
                {p.discount > 0 && <div className="text-danger">Trade Discount: <b>-{fmt(p.discount)}</b></div>}
                <div>GST shares: <b>{fmt(calcs.gstAmt)}</b></div>
                <div className="text-primary font-bold">Total: {fmt(calcs.total)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAYABLE AGGREGATE SUMMARY */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/25 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-text2">Taxable Base Subtotal</span>
          <span className="font-semibold">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-text2">Aggregate Trade Discount</span>
          <span className="font-semibold text-danger">- {fmt(totalDiscount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-text2">Total GST Compiled</span>
          <span className="font-semibold">{fmt(totalGst)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-darkBorder pt-4 mt-2">
          <span className="font-head text-base font-bold">Grand Total Payable</span>
          <span className="text-2xl font-black font-head text-primary">{fmt(grandTotal)}</span>
        </div>
      </div>

      {showPreview && activeBill && (
        <InvoiceModal 
          bill={activeBill} 
          settings={settings}
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}
