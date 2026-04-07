## Plan: 5 Feature Implementation

### 1. School Logo on All Reports & Vouchers
- Copy uploaded logo to `src/assets/school-logo.png`
- Update `printUtils.ts` `schoolHeader()` to include the logo as a base64-encoded image
- This will automatically apply to all reports (attendance, results, fee vouchers, etc.)

### 2. Teacher Account Management (Admin Dashboard)
- Create a new **"Teacher Accounts"** page in admin dashboard
- Admin can: create teacher login (email + password + link to teacher record), view existing teacher accounts, delete accounts
- Uses Supabase Edge Function to create auth users and assign "teacher" role (since client can't create users for others)
- Add nav link in `DashboardSidebar`

### 3. Parent Portal — Monthly Attendance Report
- Add an "Attendance Report" tab/card in the Parent Portal
- Show monthly attendance percentage for each linked child
- Display present/absent/late counts and percentage per month
- Reuse existing attendance data from `attendance_records` table

### 4. Fix Fee Reminder WhatsApp
- Remove the "1 day before due date" restriction
- Change to "Remind All Unpaid" button that sends WhatsApp reminders to all students with unpaid vouchers at any time
- Update the fee vouchers or fees page accordingly

### 5. Smart Timetable Generator
- Create an **interactive timetable builder** page
- Admin inputs: teachers, their subjects, weekly periods per subject, period duration, school days, number of periods per day
- **Auto-generate** a conflict-free timetable using a constraint-based algorithm
- Auto-resolve conflicts (no teacher double-booked)
- Display class-wise, teacher-wise, and subject-wise views
- Save generated timetable to the existing `timetable_entries` table

### Order of Implementation
1. Logo on reports (quick win)
2. Teacher account management (with edge function)
3. Parent attendance report
4. Fee reminder fix
5. Smart timetable generator (most complex)
