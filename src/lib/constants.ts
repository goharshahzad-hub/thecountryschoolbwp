export const classOptions = [
  "Reception", "Foundation", "Pre-1",
  "Class-1", "Class-2", "Class-3", "Class-4", "Class-5", "Class-6", "Class-7", "Class-8",
];

/**
 * Canonical class hierarchy order. Use this to sort any list of class names so that
 * Reception → Foundation → Pre-1 → Class-1 … Class-8 always renders in school order
 * (instead of alphabetically). Unknown classes fall to the end alphabetically.
 */
const CLASS_ORDER: Record<string, number> = classOptions.reduce((acc, c, i) => {
  acc[c.toLowerCase()] = i;
  return acc;
}, {} as Record<string, number>);

export const sortClasses = <T,>(items: T[], getName: (t: T) => string = (t) => String(t)): T[] => {
  return [...items].sort((a, b) => {
    const an = getName(a).trim().toLowerCase();
    const bn = getName(b).trim().toLowerCase();
    const ai = CLASS_ORDER[an] ?? 999;
    const bi = CLASS_ORDER[bn] ?? 999;
    if (ai !== bi) return ai - bi;
    return an.localeCompare(bn);
  });
};

/** Full subject list used across the app (dropdowns, forms, etc.) */
export const subjectOptions = [
  "English", "Urdu", "Math", "Science", "Islamiat",
  "Social Studies", "Computer", "Nazra/Quran",
  "General Knowledge", "Pakistan Studies",
  "Physics", "Chemistry", "Biology",
];

/** Subjects excluded from diary only */
const DIARY_EXCLUDED = ["Drawing", "Arabic", "Sindhi"];

/** Subject list specifically for diary entry forms */
export const diarySubjectOptions = subjectOptions.filter(s => !DIARY_EXCLUDED.includes(s));
