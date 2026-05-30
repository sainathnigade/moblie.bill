import { useState, useEffect } from "react";
import { dbService } from "../dbService";
import { Search, ShieldCheck, ShieldX, Calendar, User, Phone, Tag } from "lucide-react";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Warranty() {
  const [imei, setImei] = useState("");
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [warrantyRecords, setWarrantyRecords] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await dbService.getWarranty();
      setWarrantyRecords(data);
    }
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    if (!imei.trim()) { setResult(null); return; }
    const matched = warrantyRecords.find(w => w.imei.toLowerCase() === imei.trim().toLowerCase());
    setResult(matched || null);
  };

  const getCoverage = (rec) => {
    const purchase = new Date(rec.date);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + rec.durationMonths);
    const daysLeft = Math.max(0, Math.ceil((expiry - new Date()) / 86400000));
    return { expiry, active: daysLeft > 0, daysLeft };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div>
        <h2 className="font-head text-2xl font-black text-gray-900 dark:text-gray-100">IMEI & Warranty Auditor</h2>
        <p className="text-xs text-gray-400 dark:text-text3 mt-1.5">Verify device eligibility, purchase details and brand coverage windows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lookup Card */}
        <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm space-y-5 h-fit">
          <h3 className="font-head text-sm font-bold flex items-center gap-2 border-b border-gray-50 dark:border-darkBorder pb-3">
            <Search className="w-4.5 h-4.5 text-primary" /> Lookup Serial / IMEI Number
          </h3>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text2 uppercase tracking-wider">Device IMEI (15-digit) or Serial Number</label>
              <input
                type="text"
                placeholder="Enter serial number..."
                value={imei}
                onChange={e => setImei(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary dark:bg-darkSurface2 dark:border-darkBorder dark:focus:border-primary transition-all w-full text-gray-900 dark:text-gray-100 placeholder-text3"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              🔎 Check Warranty Coverage
            </button>
          </form>

          {/* All IMEI quick-list */}
          {warrantyRecords.length > 0 && (
            <div className="pt-4 border-t border-gray-50 dark:border-darkBorder">
              <div className="text-[10px] font-bold text-text3 uppercase tracking-wider mb-3">Registered Serial Numbers ({warrantyRecords.length})</div>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
                {warrantyRecords.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => { setImei(w.imei); setResult(w); setHasSearched(true); }}
                    className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-50 dark:bg-darkSurface2 border border-gray-200 dark:border-darkBorder text-gray-600 dark:text-text2 hover:border-primary hover:text-primary transition-all"
                  >
                    {w.imei}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Card */}
        {hasSearched && (
          <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder p-6 rounded-2xl shadow-sm fade-in">
            <h3 className="font-head text-sm font-bold flex items-center gap-2 border-b border-gray-50 dark:border-darkBorder pb-3 mb-5">
              📊 Auditor Results
            </h3>

            {!result ? (
              <div className="py-12 text-center">
                <ShieldX className="w-12 h-12 mx-auto text-danger/40 mb-3" />
                <div className="font-bold text-sm text-danger">IMEI / Serial Not Found</div>
                <div className="text-xs text-gray-400 dark:text-text3 mt-2">
                  This serial ID has no registered record in the store database.
                </div>
              </div>
            ) : (() => {
              const cov = getCoverage(result);
              return (
                <div className="space-y-5">
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-text2">Coverage Status:</span>
                    {cov.active ? (
                      <span className="inline-flex items-center gap-1.5 bg-success/10 text-success text-xs font-bold px-3 py-1.5 rounded-lg">
                        <ShieldCheck className="w-4 h-4" /> ACTIVE WARRANTY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-danger/10 text-danger text-xs font-bold px-3 py-1.5 rounded-lg">
                        <ShieldX className="w-4 h-4" /> EXPIRED
                      </span>
                    )}
                  </div>

                  {/* Product Card */}
                  <div className="bg-gray-50 dark:bg-darkSurface2 border border-gray-100 dark:border-darkBorder p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-text3 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Registered Product
                    </div>
                    <div className="font-head text-base font-bold text-primary">{result.productName}</div>
                    <div className="text-xs text-gray-500 dark:text-text2 mt-1 font-mono">IMEI: {result.imei}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 text-xs">
                    {[
                      { icon: Tag, label: "Invoice Reference", value: result.billNo },
                      { icon: Calendar, label: "Purchase Date", value: fmtDate(result.date) },
                      { icon: ShieldCheck, label: "Warranty Duration", value: `${result.durationMonths} Months` },
                      { icon: Calendar, label: "Expiration Date", value: fmtDate(cov.expiry) },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-gray-400 dark:text-text3 flex items-center gap-1.5">
                          <row.icon className="w-3.5 h-3.5" /> {row.label}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.value}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-darkBorder pt-3 mt-2">
                      <span className="text-gray-400 dark:text-text3">Active Days Remaining</span>
                      <span className={`font-black ${cov.active ? "text-success" : "text-danger"}`}>
                        {cov.daysLeft} Days
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t border-gray-100 dark:border-darkBorder pt-4 space-y-2">
                    <div className="text-[10px] font-bold text-text3 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Registered Client
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{result.customerName}</div>
                    <div className="text-xs text-gray-400 dark:text-text2 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {result.customerPhone}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
