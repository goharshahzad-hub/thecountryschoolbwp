import { downloadA4Pdf, printA4 } from "@/lib/printUtils";
import { format } from "date-fns";

interface DiaryEntry {
  id: string;
  class_name: string;
  section: string;
  subject: string;
  homework_text: string;
  date: string;
}

const buildDiarySlipsHtml = (entries: DiaryEntry[]) => {
  if (entries.length === 0) return "";

  // Build slips - 10 per page (5 rows × 2 cols on A4 portrait)
  const slipHtml = (entry: DiaryEntry) => `
    <div style="
      border: 1.5px dashed #888;
      padding: 6px 8px;
      width: 48.5%;
      height: calc(20% - 6px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      overflow: hidden;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c0392b;padding-bottom:3px;margin-bottom:3px;">
        <div>
          <strong style="font-size:10px;color:#c0392b;">The Country School</strong>
          <div style="font-size:6.5px;color:#666;">Model Town Fahad Campus, Bahawalpur | 📞 0322-6107000</div>
        </div>
        <span style="font-size:8.5px;color:#333;font-weight:bold;">${format(new Date(entry.date), "dd MMM yyyy")}</span>
      </div>
      <div style="font-size:9px;margin-bottom:2px;color:#333;">
        <strong>Class:</strong> ${entry.class_name}-${entry.section} &nbsp;|&nbsp; <strong>Subject:</strong> ${entry.subject}
      </div>
      <div style="font-size:9px;color:#222;flex:1;overflow:hidden;line-height:1.3;font-weight:500;">
        ${entry.homework_text.replace(/\n/g, "<br>")}
      </div>
      <div style="font-size:7.5px;color:#888;text-align:right;margin-top:2px;border-top:1px dotted #ccc;padding-top:2px;">Parent Sign: ____________</div>
    </div>
  `;

  // Group into pages of 10
  const pages: string[] = [];
  for (let i = 0; i < entries.length; i += 10) {
    const pageEntries = entries.slice(i, i + 10);
    // Fill remaining slots with last entry to keep layout consistent
    while (pageEntries.length < 10) {
      pageEntries.push(pageEntries[pageEntries.length - 1]);
    }
    pages.push(`
      <div class="print-page" style="
        display: flex;
        flex-wrap: wrap;
        gap: 4px 1.5%;
        justify-content: space-between;
        align-content: flex-start;
        height: 277mm;
        padding: 0;
      ">
        ${pageEntries.map((e) => slipHtml(e)).join("")}
      </div>
    `);
  }

  return pages.join("");
};

export const printDiarySlips = (entries: DiaryEntry[]) => {
  const html = buildDiarySlipsHtml(entries);
  if (!html) return;
  printA4(html, "Diary Slips");
};

export const downloadDiarySlipsPdf = async (entries: DiaryEntry[]) => {
  const html = buildDiarySlipsHtml(entries);
  if (!html) return;
  await downloadA4Pdf(html, "Diary_Slips");
};

/**
 * For a single diary entry, prints 10 copies on one A4 page
 */
export const printSingleDiaryAs8 = (entry: DiaryEntry) => {
  const copies = Array(10).fill(entry);
  printDiarySlips(copies);
};

/**
 * For multiple entries, print each one as its own slip on a shared page
 */
export const printMultipleDiarySlips = (entries: DiaryEntry[]) => {
  printDiarySlips(entries);
};

