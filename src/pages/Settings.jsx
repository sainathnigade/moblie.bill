import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { toast } from "../components/Toast";
import { Settings as SettingsIcon, Download, Upload, Save, Database } from "lucide-react";

export default function Settings({ onDataImport }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await dbService.getSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await dbService.saveSettings(settings);
    toast("Shop billing configuration saved successfully.", "success");
  };

  const handleSeedData = async () => {
    if (confirm("Are you sure you want to seed the database with comprehensive premium demo data (Phones, Bills, Warranties, Enquiries)?")) {
      setLoading(true);
      await dbService.seedDatabase();
      toast("Premium demonstration data seeded successfully!", "success");
      setLoading(false);
      onDataImport && onDataImport();
    }
  };

  const handleExportBackup = async () => {
    const backup = {
      bills: await dbService.getBills(),
      inventory: await dbService.getInventory(),
      customers: await dbService.getCustomers(),
      warranty: await dbService.getWarranty(),
      settings: await dbService.getSettings()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Shree_Mobile_Database_Backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Full system backup JSON exported!", "success");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.bills && parsed.inventory && parsed.settings) {
          localStorage.setItem("mhpro_bills", JSON.stringify(parsed.bills));
          localStorage.setItem("mhpro_inventory", JSON.stringify(parsed.inventory));
          localStorage.setItem("mhpro_customers", JSON.stringify(parsed.customers || []));
          localStorage.setItem("mhpro_warranty", JSON.stringify(parsed.warranty || []));
          localStorage.setItem("mhpro_settings", JSON.stringify(parsed.settings));
          setSettings(parsed.settings);
          onDataImport && onDataImport();
          toast("Database backup restored successfully!", "success");
        } else {
          toast("Invalid backup file format.", "error");
        }
      } catch {
        toast("Failed to parse JSON backup file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mr-3" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div>
        <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">System Configuration</h2>
        <p className="text-xs text-gray-400 dark:text-text3 mt-1.5">Customize GSTIN details, invoice terms and manage data backups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Details Form */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm">
          <h3 className="font-head text-sm font-bold flex items-center gap-2 border-b border-gray-50 dark:border-darkBorder pb-3 mb-5">
            <SettingsIcon className="w-4.5 h-4.5 text-primary" /> Shop Details & Tax Configuration
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Shop Display Name</label>
              <input
                type="text"
                required
                value={settings.shopName || ""}
                onChange={e => setSettings(s => ({ ...s, shopName: e.target.value }))}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">GSTIN Registration</label>
                <input
                  type="text"
                  required
                  value={settings.gstNo || ""}
                  onChange={e => setSettings(s => ({ ...s, gstNo: e.target.value }))}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Support Phone</label>
                <input
                  type="text"
                  required
                  value={settings.phone || ""}
                  onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={settings.email || ""}
                onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Business Address</label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Invoice Terms & Conditions</label>
              <textarea
                value={settings.invoiceTerms || ""}
                onChange={e => setSettings(s => ({ ...s, invoiceTerms: e.target.value }))}
                rows={4}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque Bank Name</label>
                <input
                  type="text"
                  value={settings.chequeBankName || ""}
                  onChange={e => setSettings(s => ({ ...s, chequeBankName: e.target.value }))}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Cheque Account / IFSC</label>
                <input
                  type="text"
                  value={settings.chequeAccount || ""}
                  onChange={e => setSettings(s => ({ ...s, chequeAccount: e.target.value }))}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save System Configuration
            </button>
          </form>
        </div>

        {/* Backup & Import */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm h-fit space-y-5">
          <h3 className="font-head text-sm font-bold flex items-center gap-2 border-b border-gray-50 dark:border-darkBorder pb-3">
            💾 System Backup & Restore
          </h3>

          <p className="text-xs text-gray-400 dark:text-text3 leading-relaxed">
            Ensure local business safety by exporting daily snapshots. The exported JSON file contains all active bills, inventory, warranties, customer profiles, and settings.
          </p>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 border border-gray-200 dark:border-darkBorder rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface2 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Full Database Backup (JSON)
          </button>

          <div className="border-t border-gray-100 dark:border-darkBorder pt-5">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Upload className="w-3 h-3" /> Import Database Backup File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none dark:bg-darkSurface2 dark:border-darkBorder text-gray-900 dark:text-gray-100 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-darkBorder pt-5 space-y-3">
            <label className="text-[10px] font-bold text-text2 uppercase tracking-wider block flex items-center gap-1">
              <Database className="w-3 h-3 text-primary" /> Demonstration Environment Seeder
            </label>
            <p className="text-[11px] text-gray-400 dark:text-text3 leading-normal">
              Quickly seed all tables (Inventory stock items, sales invoices, warranty logs, active enquiries) with high-fidelity realistic data for training and testing.
            </p>
            <button
              onClick={handleSeedData}
              className="w-full py-3 bg-[#e8f5e9]/20 hover:bg-success/25 dark:bg-success/10 text-success border border-success/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" /> Seed Cloud/Local Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
