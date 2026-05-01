/**
 * Build a filesystem-friendly filename for a fee voucher.
 * Format: StudentName_FatherName_Class_Month-Year.pdf
 */
export function buildVoucherFilename(opts: {
  studentName?: string;
  fatherName?: string;
  className?: string;
  section?: string | null;
  month: string;
  year: number | string;
  ext?: string;
}) {
  const sanitize = (s: string) =>
    (s || "Unknown")
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const cls = opts.section ? `Class-${opts.className}-${opts.section}` : `Class-${opts.className || ""}`;
  const parts = [
    sanitize(opts.studentName || ""),
    sanitize(opts.fatherName || ""),
    sanitize(cls),
    `${sanitize(opts.month)}-${opts.year}`,
  ];
  return parts.filter(Boolean).join("_") + (opts.ext || ".pdf");
}
