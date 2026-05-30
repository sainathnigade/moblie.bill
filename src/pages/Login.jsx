import { useState } from "react";
import { auth, isFirebaseConnected } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "../components/Toast";
import { Lock, Mail, ShieldAlert } from "lucide-react";

const DEMO_USERS = [
  { email: "admin@shreemobile.com", pass: "admin123", name: "Administrator", role: "admin" },
  { email: "staff@shreemobile.com", pass: "staff123", name: "Billing Executive", role: "staff" }
];

export default function Login({ onLogin, onCancel }) {
  const [tab, setTab] = useState("admin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTabChange = (role) => {
    setTab(role);
    setErr("");
    setEmail("");
    setPass("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (isFirebaseConnected) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;
        
        // Match user role based on email context for demonstration, 
        // or check custom claims/Firestore user metadata.
        const role = email.includes("admin") ? "admin" : "staff";
        const matched = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || (role === "admin" ? "Admin User" : "Staff Member"),
          role
        };
        
        toast(`Authorized successfully via Cloud Auth!`, "success");
        onLogin(matched);
        setLoading(false);
        return;
      } catch (error) {
        console.warn("Firebase Auth failure, checking failover offline keys:", error);
      }
    }

    // Failover standard offline keys matching
    await new Promise(r => setTimeout(r, 600));
    const matched = DEMO_USERS.find(u => u.email === email && u.pass === pass && u.role === tab);
    
    if (matched) {
      toast(`Welcome back, ${matched.name}!`, "success");
      onLogin(matched);
    } else {
      setErr("Authorization failed. Please check your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-darkBg text-gray-100 flex items-center justify-center overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(108,99,255,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,101,132,0.06)_0%,transparent_55%)] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-darkSurface border border-darkBorder p-10 rounded-3xl shadow-2xl relative z-10 fade-in mx-4">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="font-head text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📱 Shree Mobile
          </div>
          <div className="text-xs text-gray-400 font-semibold tracking-widest mt-2 uppercase">
            POS Billing & Inventory System
          </div>
        </div>

        {/* Auth Role selection tabs */}
        <div className="flex bg-darkSurface2 border border-darkBorder p-1 rounded-xl mb-6 gap-1 select-none">
          <button 
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === "admin" ? "bg-darkBorder text-gray-100 shadow-md" : "text-text2 hover:text-gray-100"
            }`}
          >
            👑 Admin
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange("staff")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === "staff" ? "bg-darkBorder text-gray-100 shadow-md" : "text-text2 hover:text-gray-100"
            }`}
          >
            💼 Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text2 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-darkSurface2 border border-darkBorder rounded-xl text-sm text-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-text3"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-text3" />
              <input 
                type="password" 
                required
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-darkSurface2 border border-darkBorder rounded-xl text-sm text-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-text3"
              />
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/25 p-3 rounded-lg text-xs text-danger">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
              <div>{err}</div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <span className="pulse">Authorizing...</span> : `Sign in as ${tab === "admin" ? "Administrator" : "Billing Staff"}`}
          </button>
        </form>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full mt-5 text-center text-xs text-text3 hover:text-white transition-all font-semibold block"
          >
            ← Back to Public Storefront Showcase
          </button>
        )}
      </div>
    </div>
  );
}
