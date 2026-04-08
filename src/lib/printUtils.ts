/**
 * Shared A4 print utility for The Country School
 * Opens a new window with A4 page settings and prints/saves as PDF
 */

import { getPreloadedLogo } from "./logoBase64";

const A4_STYLES = `
  @page {
    size: A4;
    margin: 15mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    padding: 0;
    margin: 0;
    color: #222;
    font-size: 12px;
    line-height: 1.4;
  }
  .print-page {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    padding: 10mm 0;
    page-break-after: always;
  }
  .print-page:last-child { page-break-after: auto; }
  .print-header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .print-header h1 { font-size: 20px; margin: 0; color: #c0392b; }
  .print-header h2 { font-size: 15px; margin: 4px 0; color: #333; }
  .print-header p { font-size: 11px; color: #666; margin: 2px 0; }
  .print-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 14px;
    font-size: 12px;
  }
  .print-info div span { font-weight: bold; }
  .print-info-3col { grid-template-columns: 1fr 1fr 1fr; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-bottom: 12px;
  }
  th, td {
    border: 1px solid #333;
    padding: 5px 8px;
    text-align: center;
  }
  th { background: #f0f0f0; font-size: 10px; }
  .total-row { font-weight: bold; background: #f9f9f9; }
  .term-header { background: #c0392b; color: #fff; font-weight: bold; }
  .grade-summary {
    margin-top: 12px;
    text-align: center;
    font-size: 14px;
    padding: 8px;
    border: 1px solid #ddd;
    background: #fafafa;
  }
  .print-footer {
    text-align: center;
    margin-top: 20px;
    font-size: 10px;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 8px;
  }
  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    font-size: 11px;
  }
  .signatures div {
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 4px;
    width: 130px;
  }
  /* Form print styles */
  .form-section { margin-bottom: 16px; }
  .form-section h3 { font-size: 13px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
  .form-row { display: flex; gap: 16px; margin-bottom: 6px; font-size: 12px; }
  .form-row .label { font-weight: bold; min-width: 140px; color: #555; }
  .form-row .value { flex: 1; border-bottom: 1px dotted #ccc; }
  /* List print */
  .list-title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .list-subtitle { font-size: 11px; color: #666; margin-bottom: 12px; }
  @media print { body { padding: 0; } }
`;

export const printA4 = (htmlContent: string, title: string = "Print") => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head>
<title>${title} — Preview</title>
<style>
${A4_STYLES}
.print-preview-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  background: #c0392b; color: #fff; display: flex; align-items: center;
  justify-content: space-between; padding: 8px 20px; font-family: Arial, sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.print-preview-bar span { font-size: 14px; font-weight: bold; }
.print-preview-bar button {
  background: #fff; color: #c0392b; border: none; padding: 8px 24px;
  border-radius: 4px; font-weight: bold; font-size: 13px; cursor: pointer;
}
.print-preview-bar button:hover { background: #f0f0f0; }
.print-preview-bar .close-btn {
  background: transparent; color: #fff; font-size: 13px; border: 1px solid rgba(255,255,255,0.4);
  padding: 6px 16px; border-radius: 4px; margin-left: 8px;
}
.print-preview-bar .close-btn:hover { background: rgba(255,255,255,0.15); }
body { padding-top: 50px; }
@media print {
  .print-preview-bar { display: none !important; }
  body { padding-top: 0; }
}
</style>
</head><body>
<div class="print-preview-bar">
  <span>📄 ${title} — Print Preview</span>
  <div>
    <button onclick="window.print()">🖨️ Print</button>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>
</div>
${htmlContent}
</body></html>`);
  win.document.close();
};

export const downloadA4Pdf = async (htmlContent: string, filename: string = "Document") => {
  const date = new Date().toISOString().split("T")[0];

  // html2pdf is client-only; dynamic import prevents bundling issues in some environments
  const mod = await import("html2pdf.js");
  const html2pdf = mod.default;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.background = "white";
  container.style.zIndex = "-9999";
  container.style.opacity = "0";
  container.innerHTML = `<style>${A4_STYLES}</style>${htmlContent}`;

  document.body.appendChild(container);

  // Allow the browser to render the content before capturing
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const options: any = {
      margin: [15, 15, 15, 15],
      filename: `${filename}_${date}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().set(options).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};

export const printFromRef = (ref: React.RefObject<HTMLDivElement>, title: string = "Print") => {
  const content = ref.current;
  if (!content) return;
  printA4(content.innerHTML, title);
};

export const schoolHeader = (subtitle: string = "", qrData?: string) => {
  const logo = getPreloadedLogo();
  const logoHtml = logo
    ? `<img src="${logo}" alt="TCS Logo" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin:0 auto 6px;" />`
    : "";
  const qrHtml = qrData
    ? `<div style="position:absolute;right:0;top:0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}" alt="QR" style="width:70px;height:70px;" /></div>`
    : "";
  return `
  <div class="print-header" style="position:relative;">
    ${qrHtml}
    ${logoHtml}
    <h1>The Country School — Fahad Campus</h1>
    ${subtitle ? `<h2>${subtitle}</h2>` : ""}
    <p>Model Town, Bahawalpur | 📞 +92 322 6107000 | 📧 thecountryschoolbwp@gmail.com</p>
  </div>
`;
};

export const schoolFooter = () => `
  <div class="print-footer">
    <p>This is a computer-generated document. | © ${new Date().getFullYear()} The Country School</p>
  </div>
`;

export const signatureBlock = (labels: string[] = ["Class Teacher", "Principal", "Parent's Signature"]) => `
  <div class="signatures">
    ${labels.map(l => `<div>${l}</div>`).join("")}
  </div>
`;

export const generateQRData = (reportType: string, details: Record<string, string>) => {
  const id = Math.random().toString(36).substring(2, 10).toUpperCase();
  const parts = [`Report:${reportType}`, `ID:${id}`, `Date:${new Date().toISOString().split("T")[0]}`];
  Object.entries(details).forEach(([k, v]) => parts.push(`${k}:${v}`));
  return parts.join("|");
};
