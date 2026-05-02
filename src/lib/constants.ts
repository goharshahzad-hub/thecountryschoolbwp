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

/** Resolve a class index from a string that may include a section suffix (e.g. "Class-1-A"). */
const resolveClassIndex = (raw: string): number => {
  const name = raw.trim().toLowerCase();
  if (CLASS_ORDER[name] !== undefined) return CLASS_ORDER[name];
  // Try stripping a trailing "-X" section
  const withoutSection = name.replace(/-[a-z0-9]+$/i, "");
  if (CLASS_ORDER[withoutSection] !== undefined) return CLASS_ORDER[withoutSection];
  // Try matching the longest known prefix
  for (const key of Object.keys(CLASS_ORDER)) {
    if (name.startsWith(key)) return CLASS_ORDER[key];
  }
  return 999;
};

export const sortClasses = <T,>(items: T[], getName: (t: T) => string = (t) => String(t)): T[] => {
  return [...items].sort((a, b) => {
    const an = getName(a);
    const bn = getName(b);
    const ai = resolveClassIndex(an);
    const bi = resolveClassIndex(bn);
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
