import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStudents from "./tools/list-students";
import listFeeVouchers from "./tools/list-fee-vouchers";
import attendanceSummary from "./tools/attendance-summary";
import listAnnouncements from "./tools/list-announcements";
import createAnnouncement from "./tools/create-announcement";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "country-school-mcp",
  title: "The Country School MCP",
  version: "0.1.0",
  instructions:
    "Tools for The Country School (Bahawalpur) school management app. Use these to look up students, fee vouchers, attendance and announcements, or create new announcements. All actions run as the signed-in user and respect their role (Admin, Teacher, or Parent).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStudents, listFeeVouchers, attendanceSummary, listAnnouncements, createAnnouncement],
});
