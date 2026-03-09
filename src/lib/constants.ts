export const classOptions = [
  "Reception", "Foundation", "Pre-1",
  "Class-1", "Class-2", "Class-3", "Class-4", "Class-5", "Class-6", "Class-7", "Class-8",
];

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
