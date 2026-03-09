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

  // Build slips - 8 per page
  const slipHtml = (entry: DiaryEntry) => `
    <div style="
      border: 1.5px dashed #888;
      padding: 8px 10px;
      width: 48%;
      height: calc(25% - 8px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      overflow: hidden;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #c0392b;padding-bottom:3px;margin-bottom:4px;">
        <strong style="font-size:10px;color:#c0392b;">The Country School</strong>
        <span style="font-size:8px;color:#666;">${format(new Date(entry.date), "dd MMM yyyy")}</span>
      </div>
      <div style="font-size:9px;margin-bottom:3px;color:#333;">
        <strong>Class:</strong> ${entry.class_name}-${entry.section} &nbsp;|&nbsp; <strong>Subject:</strong> ${entry.subject}
      </div>
      <div style="font-size:9px;color:#222;flex:1;overflow:hidden;line-height:1.35;">
        ${entry.homework_text.replace(/\n/g, "<br>")}
      </div>
      <div style="font-size:7px;color:#aaa;text-align:right;margin-top:2px;">Parent Sign: ____________</div>
    </div>
  `;

  // Group into pages of 8
  const pages: string[] = [];
  for (let i = 0; i < entries.length; i += 8) {
    const pageEntries = entries.slice(i, i + 8);
    // Fill remaining slots with empty if less than 8 (for consistent layout)
    while (pageEntries.length < 8) {
      pageEntries.push(pageEntries[pageEntries.length - 1]); // duplicate last entry to fill
    }
    pages.push(`
      <div class="print-page" style="
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
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
 * For a single diary entry, prints 8 copies on one A4 page
 */
export const printSingleDiaryAs8 = (entry: DiaryEntry) => {
  const copies = Array(8).fill(entry);
  printDiarySlips(copies);
};

/**
 * For multiple entries, print each one as its own slip on a shared page
 */
export const printMultipleDiarySlips = (entries: DiaryEntry[]) => {
  printDiarySlips(entries);
};

