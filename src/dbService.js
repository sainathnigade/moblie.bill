import { db, isFirebaseConnected } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc 
} from "firebase/firestore";

// Simulated Database Helper for offline testing
const LocalDB = {
  get: (key, def = []) => JSON.parse(localStorage.getItem("mhpro_" + key)) || def,
  set: (key, val) => localStorage.setItem("mhpro_" + key, JSON.stringify(val))
};

export const dbService = {
  async getSettings() {
    if (isFirebaseConnected) {
      try {
        const docRef = doc(db, "settings", "shopConfig");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data();
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("settings", {
      shopName: "Shree Mobile",
      gstNo: "27AABCU9603R1ZM",
      address: "123 Tech Street, Aurangabad, MH 431001",
      phone: "+91 98765 43210",
      email: "info@shreemobile.com",
      invoiceTerms: "1. Goods once sold will not be taken back.\n2. Warranty issues must be claimed directly through brand service centers.\n3. This is a computer-generated tax invoice generated digitally.",
      chequeBankName: "",
      chequeBranch: "",
      chequeAccount: "",
      chequeIFSC: ""
    });
  },

  async saveSettings(data) {
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "settings", "shopConfig"), data);
        return true;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    LocalDB.set("settings", data);
    return true;
  },

  async getInventory() {
    if (isFirebaseConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const list = [];
        querySnapshot.forEach(d => list.push({ ...d.data(), id: d.id }));
        return list;
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("inventory", SAMPLE_INVENTORY);
  },

  async saveInventoryItem(item) {
    const itemId = item.id || "p_" + Math.random().toString(36).slice(2, 9);
    const itemData = { ...item, id: itemId };
    
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "inventory", itemId), itemData);
        return itemData;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    
    const list = LocalDB.get("inventory", SAMPLE_INVENTORY);
    const idx = list.findIndex(i => i.id === itemId);
    if (idx >= 0) list[idx] = itemData;
    else list.push(itemData);
    LocalDB.set("inventory", list);
    return itemData;
  },

  async deleteInventoryItem(id) {
    if (isFirebaseConnected) {
      try {
        await deleteDoc(doc(db, "inventory", id));
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    }
    const list = LocalDB.get("inventory", SAMPLE_INVENTORY);
    const updated = list.filter(i => i.id !== id);
    LocalDB.set("inventory", updated);
    return true;
  },

  async getBills() {
    if (isFirebaseConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "bills"));
        const list = [];
        querySnapshot.forEach(d => list.push({ ...d.data(), id: d.id }));
        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("bills", SAMPLE_BILLS).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async saveBill(bill) {
    const billId = bill.id || "B" + Math.random().toString(36).slice(2, 9);
    const billData = { ...bill, id: billId };
    
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "bills", billId), billData);
        return billData;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    
    const list = LocalDB.get("bills", SAMPLE_BILLS);
    list.unshift(billData);
    LocalDB.set("bills", list);
    return billData;
  },

  async deleteBill(id) {
    if (isFirebaseConnected) {
      try {
        await deleteDoc(doc(db, "bills", id));
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    }
    const list = LocalDB.get("bills", SAMPLE_BILLS);
    const updated = list.filter(b => b.id !== id);
    LocalDB.set("bills", updated);
    return true;
  },

  async getCustomers() {
    if (isFirebaseConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const list = [];
        querySnapshot.forEach(d => list.push(d.data()));
        return list;
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("customers", SAMPLE_CUSTOMERS);
  },

  async saveCustomer(cust) {
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "customers", cust.phone), cust);
        return true;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    const list = LocalDB.get("customers", SAMPLE_CUSTOMERS);
    const idx = list.findIndex(c => c.phone === cust.phone);
    if (idx >= 0) list[idx] = cust;
    else list.push(cust);
    LocalDB.set("customers", list);
    return true;
  },

  async getWarranty() {
    if (isFirebaseConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "warranty"));
        const list = [];
        querySnapshot.forEach(d => list.push(d.data()));
        return list;
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("warranty", SAMPLE_WARRANTY);
  },

  async saveWarrantyRecord(w) {
    const wId = w.imei || "w_" + Math.random().toString(36).slice(2, 9);
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "warranty", wId), w);
        return true;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    const list = LocalDB.get("warranty", SAMPLE_WARRANTY);
    list.push(w);
    LocalDB.set("warranty", list);
    return true;
  },

  async getEnquiries() {
    if (isFirebaseConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "enquiries"));
        const list = [];
        querySnapshot.forEach(d => list.push({ ...d.data(), id: d.id }));
        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    return LocalDB.get("enquiries", SAMPLE_ENQUIRIES).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async saveEnquiry(enq) {
    const enqId = enq.id || "enq_" + Math.random().toString(36).slice(2, 9);
    const enqData = { ...enq, id: enqId, date: enq.date || new Date().toISOString(), status: enq.status || "Pending" };
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "enquiries", enqId), enqData);
        return enqData;
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
    const list = LocalDB.get("enquiries", SAMPLE_ENQUIRIES);
    list.unshift(enqData);
    LocalDB.set("enquiries", list);
    return enqData;
  },

  async deleteEnquiry(id) {
    if (isFirebaseConnected) {
      try {
        await deleteDoc(doc(db, "enquiries", id));
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    }
    const list = LocalDB.get("enquiries", SAMPLE_ENQUIRIES);
    const updated = list.filter(e => e.id !== id);
    LocalDB.set("enquiries", updated);
    return true;
  },

  async updateEnquiryStatus(id, status) {
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "enquiries", id), { status }, { merge: true });
        return true;
      } catch (err) {
        console.error("Firestore update error:", err);
      }
    }
    const list = LocalDB.get("enquiries", SAMPLE_ENQUIRIES);
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      LocalDB.set("enquiries", list);
    }
    return true;
  },

  async seedDatabase() {
    // Inventory Data
    for (const item of SAMPLE_INVENTORY) {
      await this.saveInventoryItem(item);
    }
    // Bills Data
    for (const bill of SAMPLE_BILLS) {
      await this.saveBill(bill);
    }
    // Customer Data
    for (const cust of SAMPLE_CUSTOMERS) {
      await this.saveCustomer(cust);
    }
    // Warranty Data
    for (const w of SAMPLE_WARRANTY) {
      await this.saveWarrantyRecord(w);
    }
    // Enquiries Data
    for (const enq of SAMPLE_ENQUIRIES) {
      await this.saveEnquiry(enq);
    }
    return true;
  }
};

const SAMPLE_INVENTORY = [
  { id: 'p1', name: 'iPhone 15 Pro Max', brand: 'Apple', model: '15 Pro Max', color: 'Natural Titanium', ram: '8GB', storage: '256GB', qty: 6, price: 144900, costPrice: 125000, gst: 18, lowStockAlert: 2 },
  { id: 'p2', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', model: 'S24 Ultra', color: 'Titanium Gray', ram: '12GB', storage: '512GB', qty: 4, price: 129999, costPrice: 110000, gst: 18, lowStockAlert: 2 },
  { id: 'p3', name: 'OnePlus 12 5G', brand: 'OnePlus', model: 'OP12', color: 'Flowy Emerald', ram: '16GB', storage: '512GB', qty: 8, price: 69999, costPrice: 60000, gst: 18, lowStockAlert: 3 },
  { id: 'p4', name: 'Redmi Note 13 Pro Plus', brand: 'Xiaomi', model: 'Note 13 Pro+', color: 'Fusion Purple', ram: '12GB', storage: '256GB', qty: 12, price: 31999, costPrice: 26000, gst: 18, lowStockAlert: 4 },
  { id: 'p5', name: 'Google Pixel 8 Pro', brand: 'Google', model: 'Pixel 8P', color: 'Bay Blue', ram: '12GB', storage: '128GB', qty: 1, price: 98999, costPrice: 85000, gst: 18, lowStockAlert: 2 }
];

const SAMPLE_BILLS = [
  { 
    id: 'B1001', 
    billNo: 'INV-1001', 
    date: new Date(Date.now() - 86400000 * 4).toISOString(), 
    customer: { name: 'Rajesh Kumar', phone: '9876543210', address: 'Shahgunj, Aurangabad' }, 
    products: [{ id: 'p1', name: 'iPhone 15 Pro Max', brand: 'Apple', model: '15 Pro Max', color: 'Natural Titanium', ram: '8GB', storage: '256GB', qty: 1, price: 144900, gst: 18, discount: 5000, subtotal: 144900, gstAmt: 25182, total: 165082, imei: '352043112345678' }], 
    subtotal: 144900, gst: 25182, discount: 5000, total: 165082, profit: 35082 
  },
  { 
    id: 'B1002', 
    billNo: 'INV-1002', 
    date: new Date(Date.now() - 86400000 * 2).toISOString(), 
    customer: { name: 'Priya Sharma', phone: '9123456789', address: 'CIDCO, Aurangabad' }, 
    products: [{ id: 'p3', name: 'OnePlus 12 5G', brand: 'OnePlus', model: 'OP12', color: 'Flowy Emerald', ram: '16GB', storage: '512GB', qty: 1, price: 69999, gst: 18, discount: 1000, subtotal: 69999, gstAmt: 12419.82, total: 81418.82, imei: '861234501234567' }], 
    subtotal: 69999, gst: 12419.82, discount: 1000, total: 81418.82, profit: 11418.82 
  },
  { 
    id: 'B1003', 
    billNo: 'INV-1003', 
    date: new Date().toISOString(), 
    customer: { name: 'Amit Patil', phone: '8765432109', address: 'Osmanpura, Aurangabad' }, 
    products: [{ id: 'p4', name: 'Redmi Note 13 Pro Plus', brand: 'Xiaomi', model: 'Note 13 Pro+', color: 'Fusion Purple', ram: '12GB', storage: '256GB', qty: 2, price: 31999, gst: 18, discount: 2000, subtotal: 63998, gstAmt: 11159.64, total: 73157.64, imei: '862345601234567, 862345601234568' }], 
    subtotal: 63998, gst: 11159.64, discount: 2000, total: 73157.64, profit: 9159.64 
  }
];

const SAMPLE_CUSTOMERS = [
  { phone: '9876543210', name: 'Rajesh Kumar', address: 'Shahgunj, Aurangabad', totalBills: 1, totalSpent: 165082 },
  { phone: '9123456789', name: 'Priya Sharma', address: 'CIDCO, Aurangabad', totalBills: 1, totalSpent: 81418.82 },
  { phone: '8765432109', name: 'Amit Patil', address: 'Osmanpura, Aurangabad', totalBills: 1, totalSpent: 73157.64 }
];

const SAMPLE_WARRANTY = [
  { imei: '352043112345678', billNo: 'INV-1001', customerName: 'Rajesh Kumar', customerPhone: '9876543210', productName: 'iPhone 15 Pro Max', date: new Date(Date.now() - 86400000 * 4).toISOString(), durationMonths: 12 },
  { imei: '861234501234567', billNo: 'INV-1002', customerName: 'Priya Sharma', customerPhone: '9123456789', productName: 'OnePlus 12 5G', date: new Date(Date.now() - 86400000 * 2).toISOString(), durationMonths: 12 },
  { imei: '862345601234567', billNo: 'INV-1003', customerName: 'Amit Patil', customerPhone: '8765432109', productName: 'Redmi Note 13 Pro Plus', date: new Date().toISOString(), durationMonths: 12 }
];

const SAMPLE_ENQUIRIES = [
  { id: 'enq1', customerName: 'Rohan Deshmukh', customerPhone: '9876501234', productName: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', model: 'S24 Ultra', message: 'Is the Titanium Yellow variant available in stock?', date: new Date(Date.now() - 3600000 * 4).toISOString(), status: 'Pending' },
  { id: 'enq2', customerName: 'Neha Joshi', customerPhone: '9890123456', productName: 'iPhone 15 Pro Max', brand: 'Apple', model: '15 Pro Max', message: 'Do you offer any exchange discount on iPhone 11?', date: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'Contacted' }
];

