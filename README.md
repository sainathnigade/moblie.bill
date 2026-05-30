# 📱 Shree Mobile — Billing & Inventory System

A modern, full-featured **POS (Point of Sale) Billing, Inventory Management, and Warranty Tracking** web application built for retail mobile shops.

## 📌 What is this project?

Shree Mobile is a web-based POS system made for mobile phone retailers. It combines billing, inventory control, customer management, warranty lookup, and reporting into one dashboard.

## 🎯 Why we made it

This project was created to:

- simplify daily billing and invoice creation for shop owners
- automate inventory tracking and low-stock alerts
- store customer purchase history and warranty details
- generate sales reports and export data easily
- provide a modern, responsive admin interface with fast performance

---

## ✨ Features

| Module             | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| **Login System**   | Admin & Staff login with role-based access                       |
| **Dashboard**      | Total sales, today's sales, recent bills, stock summary, charts  |
| **POS Billing**    | Create invoices with customer details, IMEI, GST, discount       |
| **Invoice History**| Search old bills by IMEI / phone / bill number / customer name   |
| **Inventory**      | Add, edit, delete stock — low-stock alerts, Excel export         |
| **Warranty Lookup**| Search IMEI → see purchase date, customer, warranty status       |
| **Customer Directory** | All registered clients with WhatsApp contact links           |
| **Sales Reports**  | SVG charts (bar, pie, line) + Excel export                       |
| **Settings**       | Shop name, GSTIN, invoice terms, JSON backup / restore           |
| **PDF & Print**    | Generate & download GST-compliant PDF invoices                   |
| **WhatsApp Share** | Share invoice summary directly via WhatsApp                      |
| **Dark / Light Mode** | Toggle theme from the top bar                                 |

---

## 🛠️ Tech Stack

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| React 19       | UI framework                   |
| Vite 8         | Build tool & dev server        |
| Tailwind CSS 3 | Utility-first styling          |
| Firebase       | Auth & Firestore (cloud DB)    |
| jsPDF          | PDF invoice generation         |
| SheetJS (xlsx) | Excel export                   |
| Lucide React   | Icon library                   |
| Google Fonts   | Syne + DM Sans typography      |

---

## 📋 Prerequisites

Make sure the following are installed on your computer before starting:

1. **Node.js** (v18 or above)
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Git** (optional, for cloning)
   - Download: https://git-scm.com/

---

## 🚀 How to Run (Step by Step)

### Step 1 — Clone or Download the Project

**Option A: Using Git**
```bash
git clone <your-repo-url>
cd moblie.bill
```

**Option B: Manual Download**
- Download the project ZIP file
- Extract it to any folder (e.g., `D:\moblie.bill`)
- Open a terminal/command prompt in that folder

---

### Step 2 — Install Dependencies

Open a terminal inside the project folder and run:

```bash
npm install
```

This will download all required packages (`react`, `tailwindcss`, `firebase`, `jspdf`, `xlsx`, `lucide-react`, etc.) into the `node_modules` folder.

> ⏳ This may take 1–3 minutes on the first run.

---

### Step 3 — Start the Development Server

```bash
npm run dev
```

You will see output like:

```
VITE v8.x.x  ready in 400 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 4 — Open in Browser

Open your browser and go to:

```
http://localhost:5173/
```

---

## 📂 Project Structure

```
moblie.bill/
├── index.html                  # HTML entry point (fonts, CDN scripts)
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind theme & design tokens
├── postcss.config.js           # PostCSS pipeline
├── firebase.json               # Firebase hosting config
├── .firebaserc                 # Firebase project ID
│
├── public/                     # Static assets
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Main app shell (router, theme, sidebar)
    ├── index.css               # Global styles + Tailwind directives
    ├── firebase.js             # Firebase client initialization
    ├── dbService.js            # Database abstraction (Firestore + LocalStorage)
    │
    ├── components/
    │   ├── Sidebar.jsx         # Navigation sidebar
    │   ├── Toast.jsx           # Notification toasts
    │   ├── InvoiceModal.jsx    # Invoice view, PDF, print, WhatsApp
    │   └── SalesCharts.jsx     # SVG-based analytics charts
    │
    └── pages/
        ├── Login.jsx           # Authentication page
        ├── Dashboard.jsx       # Analytics dashboard
        ├── Billing.jsx         # POS invoice creation
        ├── Invoices.jsx        # Invoice search & history
        ├── Inventory.jsx       # Stock management (CRUD + Excel)
        ├── Warranty.jsx        # IMEI warranty lookup
        ├── Customers.jsx       # Client directory
        ├── Reports.jsx         # Sales reports & charts
        └── Settings.jsx        # Shop config & backup
```

---

## 🔧 Available Commands

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `npm install`     | Install all dependencies                    |
| `npm run dev`     | Start development server (http://localhost:5173) |
| `npm run build`   | Create production build in `dist/` folder   |
| `npm run preview` | Preview the production build locally        |
| `npm run lint`    | Run ESLint code quality checks              |

---

## � Push this project to GitHub

If you want to store this project on GitHub, follow these steps:

```bash
cd moblie.bill
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If the repo already exists, use:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## �🌐 Deploy to Firebase Hosting (Optional)

If you want to publish the app online:

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Update Firebase Config

Edit `src/firebase.js` and replace the placeholder config with your real Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/).

### 4. Build & Deploy
```bash
npm run build
firebase deploy
```

Your app will be live at: `https://<your-project-id>.web.app`

---

## 💾 Data Storage

By default, the app uses **LocalStorage** as the database — all data is saved in your browser.

To switch to **Firebase Firestore** (cloud database):

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable **Firestore Database** in the Firebase console
3. Enable **Authentication** (Email/Password provider)
4. Copy your Firebase config and paste it into `src/firebase.js`
5. The app will automatically use Firestore when Firebase is properly configured

---

## 📦 Backup & Restore

- Go to **Settings** page → click **"Export Full Database Backup (JSON)"**
- To restore, click **"Import Database Backup File"** and select the JSON file

---

## 🎨 Customization

### Change Shop Name
- Go to **Settings** page → update "Shop Display Name"
- Or edit the default in `src/dbService.js` (line ~29)

### Change Theme Colors
- Edit `tailwind.config.js` → `theme.extend.colors` section

### Change Fonts
- Edit the Google Fonts link in `index.html`
- Update `tailwind.config.js` → `theme.extend.fontFamily`

---

## ❓ Troubleshooting

| Problem                          | Solution                                      |
| -------------------------------- | --------------------------------------------- |
| `npm install` fails              | Delete `node_modules` folder and try again     |
| Port 5173 already in use         | Kill the process or use `npx vite --port 3000` |
| Blank white page                 | Check browser console (F12) for errors         |
| Styles not loading               | Make sure `tailwindcss` is installed correctly  |
| Firebase errors                  | App works fine without Firebase (uses LocalStorage) |

---

## 📄 License

This project is private and built for **Shree Mobile** retail billing operations.

---

> Built with ❤️ using React + Vite + Tailwind CSS
