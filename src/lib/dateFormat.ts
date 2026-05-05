/**
 * Standard project-wide date format: DD-MM-YYYY.
 * Accepts a Date, an ISO string (YYYY-MM-DD or full ISO), or empty/null.
 */
export const formatDate = (input: string | Date | null | undefined): string => {
  if (!input) return "";
  let d: Date;
  if (input instanceof Date) d = input;
  else if (typeof input === "string") {
    // YYYY-MM-DD short form → parse as local date to avoid TZ shifts
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    else d = new Date(input);
  } else return "";
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const formatDateTime = (input: string | Date | null | undefined): string => {
  const base = formatDate(input);
  if (!base) return "";
  const d = input instanceof Date ? input : new Date(input as string);
  if (isNaN(d.getTime())) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${base} ${hh}:${mi}`;
};
