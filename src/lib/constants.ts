/**
 * Canonical class hierarchy. Some classes have legacy DB names that we keep
 * accepting so existing students/vouchers/results keep working unchanged.
 *   Reception   ← also "Play Group"
 *   Foundation  ← also "Nursery"
 *   Pre-1       ← also "Prep"
 *   Class-1 … Class-8
 */
export const classOptions = [
  "Reception", "Foundation", "Pre-1",
  "Class-1", "Class-2", "Class-3", "Class-4", "Class-5", "Class-6", "Class-7", "Class-8",
];

/** Maps any accepted alias to its canonical class name. */
const CLASS_ALIASES: Record<string, string> = {
  "play group": "Reception",
  "playgroup": "Reception",
  "nursery": "Foundation",
  "prep": "Pre-1",
};

/** Resolve any alias / legacy name to the canonical class name (or returns the input unchanged). */
export const canonicalClassName = (raw: string): string => {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  return CLASS_ALIASES[key] ?? raw;
};

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
  const original = raw.trim().toLowerCase();
  // Try alias resolution first so Nursery/Prep/Play Group sort with their canonical class
  const aliasedFull = (CLASS_ALIASES[original] ?? raw).toLowerCase();
  if (CLASS_ORDER[aliasedFull] !== undefined) return CLASS_ORDER[aliasedFull];
  if (CLASS_ORDER[original] !== undefined) return CLASS_ORDER[original];
  const withoutSection = original.replace(/-[a-z0-9]+$/i, "");
  const aliasedNoSection = (CLASS_ALIASES[withoutSection] ?? withoutSection).toLowerCase();
  if (CLASS_ORDER[aliasedNoSection] !== undefined) return CLASS_ORDER[aliasedNoSection];
  if (CLASS_ORDER[withoutSection] !== undefined) return CLASS_ORDER[withoutSection];
  for (const key of Object.keys(CLASS_ORDER)) {
    if (original.startsWith(key)) return CLASS_ORDER[key];
  }
  return 999;
};

export const compareClassNames = (a: string, b: string): number => {
  const ai = resolveClassIndex(a);
  const bi = resolveClassIndex(b);
  if (ai !== bi) return ai - bi;
  return a.localeCompare(b, undefined, { numeric: true });
};

export const sortClasses = <T,>(items: T[], getName: (t: T) => string = (t) => String(t)): T[] => {
  return [...items].sort((a, b) => {
    const an = getName(a);
    const bn = getName(b);
    return compareClassNames(an, bn);
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
