import { jsPDF } from "jspdf";
import { Sale, StoreSettings } from "../types";

export function generateInvoicePDF(sale: Sale, settings: StoreSettings): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [24, 24, 27]; // Zinc 900
  const secondaryColor = [82, 82, 91]; // Zinc 600
  const accentColor = [16, 185, 129]; // Emerald 500
  const lightBg = [244, 244, 245]; // Zinc 100
  const borderColor = [228, 228, 231]; // Zinc 200

  // 1. Header Banner & Business Info
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, 12, contentWidth, 34, 3, 3, "F");

  // Store Name
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(settings.businessName, margin + 8, 22);

  // Store Tagline / Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(settings.tagline, margin + 8, 28);
  doc.text(`${settings.address} • Tel: ${settings.phone}`, margin + 8, 33);
  doc.text(`Email: ${settings.email} • Tax ID: ${settings.taxId}`, margin + 8, 38);

  // Right Side: INVOICE Tag
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("INVOICE", pageWidth - margin - 8, 24, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("PAID & VERIFIED", pageWidth - margin - 8, 31, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`#${sale.invoiceNumber}`, pageWidth - margin - 8, 38, { align: "right" });

  // 2. Client & Invoice Metadata Section
  const metaY = 54;

  // Bill To Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("BILLED TO:", margin, metaY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(sale.customerName || "Walk-in Retail Customer", margin, metaY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  if (sale.customerEmail) {
    doc.text(`Email: ${sale.customerEmail}`, margin, metaY + 11);
  }
  if (sale.customerPhone) {
    doc.text(`Phone: ${sale.customerPhone}`, margin, metaY + 16);
  }
  if (sale.customerAddress) {
    doc.text(`Address: ${sale.customerAddress}`, margin, metaY + 21);
  }

  // Invoice Details Box (Right aligned)
  const metaRightX = pageWidth - margin;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const dateStr = new Date(sale.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Issue Date: ${dateStr}`, metaRightX, metaY, { align: "right" });
  doc.text(`Cashier / Register: ${sale.cashierName}`, metaRightX, metaY + 5, { align: "right" });
  doc.text(`Payment Method: ${sale.paymentMethod}`, metaRightX, metaY + 10, { align: "right" });

  if (sale.paymentDetails?.authCode) {
    doc.text(`Auth Code: ${sale.paymentDetails.authCode}`, metaRightX, metaY + 15, { align: "right" });
  } else if (sale.paymentDetails?.refId) {
    doc.text(`Ref ID: ${sale.paymentDetails.refId}`, metaRightX, metaY + 15, { align: "right" });
  }

  // 3. Table Header
  const tableTop = 82;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, tableTop, contentWidth, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.text("ITEM & DESCRIPTION", margin + 4, tableTop + 5.5);
  doc.text("QTY", margin + 105, tableTop + 5.5, { align: "center" });
  doc.text("UNIT PRICE", margin + 125, tableTop + 5.5, { align: "right" });
  doc.text("TAX", margin + 145, tableTop + 5.5, { align: "right" });
  doc.text("AMOUNT", pageWidth - margin - 4, tableTop + 5.5, { align: "right" });

  // 4. Table Rows
  let currentY = tableTop + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  sale.items.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, contentWidth, 8, "F");
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    // Truncate name if long
    const cleanName = item.name.length > 44 ? item.name.substring(0, 42) + "..." : item.name;
    doc.text(cleanName, margin + 4, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`${item.quantity}`, margin + 105, currentY + 5.5, { align: "center" });
    doc.text(`${settings.currency}${item.price.toFixed(2)}`, margin + 125, currentY + 5.5, { align: "right" });
    doc.text(`${item.taxRate}%`, margin + 145, currentY + 5.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const lineTotal = item.price * item.quantity;
    doc.text(`${settings.currency}${lineTotal.toFixed(2)}`, pageWidth - margin - 4, currentY + 5.5, { align: "right" });

    // Row border line
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

    currentY += 8;
  });

  // 5. Totals Breakdown Section
  const totalsStartY = currentY + 6;
  const totalsLabelX = pageWidth - margin - 55;
  const totalsValueX = pageWidth - margin - 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  doc.text("Subtotal:", totalsLabelX, totalsStartY);
  doc.text(`${settings.currency}${sale.subtotal.toFixed(2)}`, totalsValueX, totalsStartY, { align: "right" });

  let offset = totalsStartY + 6;

  if (sale.discountAmount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text("Discount:", totalsLabelX, offset);
    doc.text(`-${settings.currency}${sale.discountAmount.toFixed(2)}`, totalsValueX, offset, { align: "right" });
    offset += 6;
  }

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Tax (Sales Tax/VAT):", totalsLabelX, offset);
  doc.text(`${settings.currency}${sale.taxAmount.toFixed(2)}`, totalsValueX, offset, { align: "right" });
  offset += 8;

  // Grand Total Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(totalsLabelX - 4, offset - 5, 60, 12, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("TOTAL DUE:", totalsLabelX, offset + 3);
  doc.text(`${settings.currency}${sale.total.toFixed(2)}`, totalsValueX, offset + 3, { align: "right" });

  offset += 16;

  // Payment Breakdown
  if (sale.paymentMethod === "Cash" && sale.paymentDetails.tendered) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Cash Tendered: ${settings.currency}${sale.paymentDetails.tendered.toFixed(2)}`, totalsLabelX, offset);
    doc.text(`Change Given: ${settings.currency}${(sale.paymentDetails.change || 0).toFixed(2)}`, totalsValueX, offset, { align: "right" });
    offset += 8;
  }

  // 6. Security Barcode & Notes Box (Bottom Left)
  const notesY = totalsStartY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Terms & Return Policy:", margin, notesY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(settings.receiptFooter, margin, notesY + 5, { maxWidth: 95 });

  // Simulated Barcode graphic on invoice
  const barcodeY = notesY + 18;
  doc.setFillColor(0, 0, 0);
  const code = sale.invoiceNumber.replace(/[^A-Za-z0-9]/g, "");
  for (let i = 0; i < 48; i++) {
    const isBar = (i * 7 + code.charCodeAt(i % code.length)) % 3 !== 0;
    if (isBar) {
      const w = (i % 5 === 0) ? 1.2 : 0.6;
      doc.rect(margin + (i * 1.5), barcodeY, w, 8, "F");
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`INVOICE BARCODE: *${sale.invoiceNumber}*`, margin, barcodeY + 12);

  // 7. Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated digitally via RetailFlow POS • Cloud Synced on ${new Date().toISOString()}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePDF(sale: Sale, settings: StoreSettings) {
  const doc = generateInvoicePDF(sale, settings);
  doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
}

export function openPrintInvoice(sale: Sale, settings: StoreSettings) {
  const doc = generateInvoicePDF(sale, settings);
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(blobUrl, "_blank");
  if (printWindow) {
    printWindow.focus();
  }
}
