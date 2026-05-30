import  { useRef } from "react";
import { X, Printer, Download, Share2 } from "lucide-react";
import { toast } from "./Toast";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const amountToWords = (amount) => {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };

  const rupees = Math.floor(amount || 0);
  const paise = Math.round(((amount || 0) - rupees) * 100);
  let words = rupees ? `${convert(rupees)} Rupees` : "Zero Rupees";
  if (paise) words += ` and ${convert(paise)} Paise`;
  return `${words} Only`;
};

export default function InvoiceModal({ bill, onClose, settings = {} }) {
  const printAreaRef = useRef();

  const handleWhatsAppShare = () => {
    const formattedAmt = fmt(bill.total);
    const shop = settings.shopName || "Shree Mobile";
    const textMsg = `*INVOICE RECEIPT FROM ${shop.toUpperCase()}*\n\n` + 
      `*Invoice No:* ${bill.billNo}\n` +
      `*Date:* ${fmtDate(bill.date)}\n` +
      `*Client:* ${bill.customer.name}\n` +
      `*Total Amount:* ${formattedAmt}\n\n` +
      `Your warranty has been registered successfully. Thank you for shopping with us!`;

    window.open(`https://wa.me/91${bill.customer.phone}?text=${encodeURIComponent(textMsg)}`, "_blank");
  };

  const handlePrint = () => {
    const innerHtml = printAreaRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt - ${bill.billNo}</title>
          <style>
            body { font-family: 'DM Sans', sans-serif; padding: 40px; color: #111119; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px 12px; border: 1px solid #e1e3ed; font-size: 13px; text-align: left; }
            th { background: #f4f5fa; font-weight: 700; }
            .header-flex { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .totals-container { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 20px; }
            .grand-total { font-size: 18px; font-weight: 700; color: #6c63ff; border-top: 2px solid #6c63ff; padding-top: 8px; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          ${innerHtml}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePDFExport = () => {
    const { jsPDF } = window.jspdf || window.importjsPDF || {};
    if (!window.jspdf) {
      toast("PDF Exporter SDK not loaded yet. Trying browser printing instead.", "error");
      return;
    }

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const primaryColor = [37, 99, 235];
    const darkSlate = [28, 31, 42];
    const grayText = [101, 116, 139];
    const pageWidth = 210;
    const margin = 14;

    // Outer invoice frame
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(10, 10, pageWidth - 20, 277, 6, 6, "D");

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${settings.shopName || "Shree Mobile"} Shop Bill`, margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    const shopLines = [settings.shopName || "Shree Mobile", settings.address || "", `GSTIN: ${settings.gstNo || "-"}`, `Phone: ${settings.phone || "-"}`];
    shopLines.forEach((line, index) => doc.text(line, margin, 26 + index * 5));
    if (settings.email) {
      doc.text(`Email: ${settings.email}`, margin, 26 + shopLines.length * 5);
    }

    // Boxes for customer and invoice details
    const boxY = 46;
    const boxHeight = 54;
    const leftBoxWidth = 100;
    const rightBoxWidth = pageWidth - margin * 2 - leftBoxWidth - 8;
    doc.setFillColor(244, 245, 255);
    doc.setDrawColor(220, 220, 225);
    doc.roundedRect(margin, boxY, leftBoxWidth, boxHeight, 4, 4, "FD");
    doc.roundedRect(margin + leftBoxWidth + 8, boxY, rightBoxWidth, boxHeight, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("PARTY NAME", margin + 3, boxY + 8);
    doc.text("INVOICE DETAILS", margin + leftBoxWidth + 11, boxY + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(bill.customer.name || "-", margin + 3, boxY + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  const partyLines = [`Phone: ${bill.customer.phone || "-"}`];

if (bill.customer.address) {
  partyLines.push(`Address: ${bill.customer.address}`);
}

if (settings.email) {
  partyLines.push(`Email: ${settings.email}`);
}

let partyY = boxY + 22;

const partyWrapperWidth = leftBoxWidth - 8;

partyLines.forEach((line) => {
  const wrappedLines = doc.splitTextToSize(line, partyWrapperWidth);

  wrappedLines.forEach((wrappedText) => {
    doc.text(wrappedText, margin + 3, partyY);
    partyY += 5;
  });
});

    const detailX = margin + leftBoxWidth + 11;
    const detailValueX = margin + leftBoxWidth + 8 + rightBoxWidth - 4;
    const detailStartY = boxY + 16;
    const detailGap = 6;
    const detailLines = [
      [`Invoice No:`, bill.billNo],
      [`Order No:`, bill.orderNumber || `-`],
      [`Date:`, fmtDate(bill.date)],
      [`Warranty till:`, bill.warrantyTill ? fmtDate(bill.warrantyTill) : `-`],
      [`Payment Method:`, bill.paymentMethod || `Cash`]
    ];
    detailLines.forEach((row, idx) => {
      const offsetY = detailStartY + idx * detailGap;
      doc.setFont("helvetica", "normal");
      doc.text(row[0], detailX, offsetY);
      doc.setFont("helvetica", "bold");
      doc.text(row[1], detailValueX, offsetY, { align: "right" });
    });

    let y = boxY + boxHeight + 12;

    const tableWidth = pageWidth - margin * 2;
    const colX = {
      index: margin + 2,
      name: margin + 12,
      hsn: margin + 96,
      qty: margin + 125,
      price: margin + 155,
      amount: pageWidth - margin - 2
    };

    // Table header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 4, tableWidth, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("#", colX.index, y);
    doc.text("Item Name", colX.name, y);
    doc.text("HSN", colX.hsn, y, { align: "center" });
    doc.text("Qty", colX.qty, y, { align: "center" });
    doc.text("Price/Unit", colX.price, y, { align: "right" });
    doc.text("Amount", colX.amount, y, { align: "right" });

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

    bill.products.forEach((p, index) => {
      const itemName = p.name || "-";
      const details = `${p.brand || ""} ${p.model || ""}`.trim();
      doc.text(String(index + 1), colX.index, y);
      doc.text(itemName, colX.name, y);
      doc.text(p.hsn || "-", colX.hsn, y, { align: "center" });
      doc.text(String(p.qty), colX.qty, y, { align: "center" });
      doc.text(fmt(p.price), colX.price, y, { align: "right" });
      doc.text(fmt(p.total), colX.amount, y, { align: "right" });
      y += 6;
      if (details) {
        doc.setFontSize(8);
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text(details, colX.name, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }
      if (p.imei) {
        doc.setFontSize(8);
        doc.text(`IMEI: ${p.imei}`, colX.name, y);
        y += 5;
        doc.setFontSize(9);
      }
      y += 2;
      doc.setDrawColor(235, 236, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, pageWidth - margin, y - 1);
    });

    const tableBottomY = y;
    doc.setLineWidth(0.5);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, tableBottomY, pageWidth - margin, tableBottomY);
    doc.rect(margin, boxY + boxHeight + 2, tableWidth, tableBottomY - (boxY + boxHeight + 2), "D");
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(`Taxable Subtotal: ${fmt(bill.subtotal)}`, margin + 90, y);
    doc.text(`Cash Discount: -${fmt(bill.discount)}`, margin + 90, y + 6);
    doc.text(`GST Total: ${fmt(bill.gst)}`, margin + 90, y + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`Grand Total: ${fmt(bill.total)}`, margin + 90, y + 22);

    const termsY = y + 34;
    const termsText = settings.invoiceTerms || "1. Goods once sold will not be taken back.\n2. Warranty issues must be claimed directly through brand service centers.\n3. This is a computer-generated tax invoice generated digitally.";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("Terms and Conditions:", margin, termsY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(doc.splitTextToSize(termsText, 100), margin, termsY + 6);

    const wordsY = termsY + 6 + doc.splitTextToSize(termsText, 100).length * 4 + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Amount in Words:", margin, wordsY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const amountWords = doc.splitTextToSize(amountToWords(bill.total), pageWidth - margin * 2 - 20);
    doc.text(amountWords, margin, wordsY + 6);

    doc.setFillColor(255, 243, 199);
    doc.setDrawColor(249, 227, 144);
    doc.roundedRect(pageWidth - margin - 60, termsY, 60, 30, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text("Total", pageWidth - margin - 30, termsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.text(fmt(bill.total), pageWidth - margin - 30, termsY + 20, { align: "center" });

    const thanksY = Math.max(wordsY + amountWords.length * 4 + 15, termsY + 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Thank You For your Business !!! Please visit us again !!!", pageWidth / 2, thanksY, { align: "center" });

    doc.save(`${bill.billNo || "invoice"}.pdf`);
    toast("PDF Invoice generated and downloaded!", "success");
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-darkSurface border border-gray-200 dark:border-darkBorder rounded-2xl w-full max-w-[840px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Actions Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between">
          <h3 className="font-head text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📄 GST Invoice Receipt
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-all dark:bg-darkSurface2 dark:text-gray-200 dark:hover:bg-darkSurface3"
            >
              <Printer className="w-3.5 h-3.5" /> Direct Print
            </button>
            <button 
              onClick={handlePDFExport} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button 
              onClick={handleWhatsAppShare} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success font-semibold text-xs rounded-lg transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp Client
            </button>
            <button 
              onClick={onClose} 
              className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-darkSurface2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-darkBg">
          <div ref={printAreaRef} className="invoice-preview bg-white text-gray-900 p-8 rounded-xl border border-gray-200 shadow-sm dark:bg-white">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-2xl font-black text-[#1f2b3b]">{settings.shopName || "Shree Mobile"} Shop Bill</div>
                <div className="mt-2 text-sm text-gray-500">{settings.shopName || "Shree Mobile"}</div>
                <div className="mt-1 text-xs text-gray-500 whitespace-pre-line">{settings.address}</div>
                <div className="mt-2 text-xs text-gray-500">GSTIN: <b className="text-gray-900">{settings.gstNo || "-"}</b></div>
                <div className="text-xs text-gray-500">Phone: <b className="text-gray-900">{settings.phone || "-"}</b></div>
              </div>

            </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

  {/* PARTY BOX */}
  <div className="rounded-2xl border border-gray-200 bg-[#f8f7ff] p-5 min-h-[170px]">
    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-3">
      Party Name
    </div>

    <div className="text-sm font-bold text-gray-900 break-words">
      {bill.customer.name}
    </div>

    <div className="mt-3 text-xs text-gray-600 break-all">
      Phone: <b>{bill.customer.phone}</b>
    </div>

    {bill.customer.address && (
      <div className="mt-2 text-xs text-gray-600 break-words">
        Address: {bill.customer.address}
      </div>
    )}

    {settings.email && (
      <div className="mt-2 text-xs text-gray-600 break-all">
        Email: {settings.email}
      </div>
    )}
  </div>

  {/* INVOICE DETAILS */}
  <div className="rounded-2xl border border-gray-200 bg-[#f8f7ff] p-5 min-h-[170px]">
    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-3">
      Invoice Details
    </div>

    <div className="grid gap-2 text-xs text-gray-600">

      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <span className="font-semibold text-gray-500">
          Invoice No:
        </span>

        <span className="font-semibold text-gray-900 text-right break-all">
          {bill.billNo}
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <span className="font-semibold text-gray-500">
          Order No:
        </span>

        <span className="font-semibold text-gray-900 text-right">
          {bill.orderNumber || "-"}
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <span className="font-semibold text-gray-500">
          Date:
        </span>

        <span className="font-semibold text-gray-900 text-right">
          {fmtDate(bill.date)}
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <span className="font-semibold text-gray-500">
          Warranty till:
        </span>

        <span className="font-semibold text-gray-900 text-right">
          {bill.warrantyTill ? fmtDate(bill.warrantyTill) : "-"}
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
        <span className="font-semibold text-gray-500">
          Payment Method:
        </span>

        <span className="font-semibold text-gray-900 text-right">
          {bill.paymentMethod || "Cash"}
        </span>
      </div>

    </div>
  </div>

</div>

           <table className="w-full border-collapse table-fixed mb-6 border border-gray-200 rounded-xl overflow-hidden">
  <thead>
    <tr className="bg-primary text-white text-sm">

      <th className="w-[6%] py-3 px-3 text-left">
        #
      </th>

      <th className="w-[44%] py-3 px-3 text-left">
        Item Name
      </th>

      <th className="w-[12%] py-3 px-3 text-center">
        HSN
      </th>

      <th className="w-[10%] py-3 px-3 text-center">
        Qty
      </th>

      <th className="w-[14%] py-3 px-3 text-right">
        Price/Unit
      </th>

      <th className="w-[14%] py-3 px-3 text-right">
        Amount
      </th>

    </tr>
  </thead>

  <tbody>
    {bill.products.map((p, idx) => (
      <tr
        key={idx}
        className="border-b border-gray-200 align-top hover:bg-gray-50"
      >

        <td className="py-4 px-3 text-sm text-gray-700">
          {idx + 1}
        </td>

        <td className="py-4 px-3 text-sm text-gray-900">

          <div className="font-semibold break-words">
            {p.name}
          </div>

          <div className="text-[11px] text-gray-500 mt-1 break-words leading-5">
            {p.brand} {p.model}
            {p.ram ? ` · ${p.ram}` : ""}
            {p.storage ? ` / ${p.storage}` : ""}
            {p.color ? ` · ${p.color}` : ""}
          </div>

          {p.imei && (
            <div className="text-[11px] text-gray-500 mt-1 break-all">
              IMEI: {p.imei}
            </div>
          )}

        </td>

        <td className="py-4 px-3 text-sm text-center text-gray-700">
          {p.hsn || "-"}
        </td>

        <td className="py-4 px-3 text-sm text-center text-gray-700">
          {p.qty}
        </td>

        <td className="py-4 px-3 text-sm text-right text-gray-700 whitespace-nowrap">
          {fmt(p.price)}
        </td>

        <td className="py-4 px-3 text-sm text-right font-bold text-gray-900 whitespace-nowrap">
          {fmt(p.total)}
        </td>

      </tr>
    ))}
  </tbody>
</table>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-3">Terms and Conditions:</div>
                <div className="text-xs text-gray-600 whitespace-pre-line leading-6">{settings.invoiceTerms}</div>

                <div className="mt-6 text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-2">Amount in Words:</div>
                <div className="text-sm font-semibold text-gray-900">{amountToWords(bill.total)}</div>

                {bill.notes && (
                  <div className="mt-6">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-2">Description:</div>
                    <div className="text-sm text-gray-900 whitespace-pre-line">{bill.notes}</div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[#fff7df] border border-[#f9e3a8] p-4">
                <div className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-2">Total</div>
                <div className="text-3xl font-black text-gray-900">{fmt(bill.total)}</div>
              </div>
            </div>

            <div className="mt-10 text-center text-sm font-semibold text-gray-600">
              Thank You For your Business !!! Please visit us again !!!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
