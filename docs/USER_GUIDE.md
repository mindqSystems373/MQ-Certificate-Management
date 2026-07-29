# User Guide

## Logging in

Go to the app URL and sign in with your Mind Q Systems account. Check **Remember me** to stay signed in longer. You'll land on the **Super Admin Panel** or **Management Panel** depending on your role.

---

## Super Admin Panel

### Dashboard
Shows total students, issued/pending certificates, and how many certificates were generated today and this month, plus the latest certificates issued and a recent activity feed.

### Enter Student Data (generates the certificate)
1. Open **Enter Student Data** from the sidebar.
2. Fill in the student's full name, guardian name, email, phone, course, faculty, grade, and start/end dates. All fields are required; email and phone are checked for duplicates automatically.
3. Click **Submit & Generate Certificate**.
4. The system saves the student, assigns a unique certificate number (e.g. `MQHYD000001`), and generates the certificate PDF — all in one step. The certificate number and a **Download PDF** button appear immediately on the right.

### View Certificate
1. Open **View Certificate**.
2. Enter a certificate number and click **Search**.
3. Review the student's details, then click **View Certificate** to preview the PDF in-page, or **Download** to save it.

### Manage Courses / Faculties / Grades
Each page lets you add a new entry and see the current list. Use **Deactivate** to retire an entry — deactivated items disappear from the dropdowns on the student form but existing student/certificate records are never affected.

### Manage Template
Edit the certificate's company name, tagline, body wording (you can use `{{studentName}}`, `{{courseName}}`, `{{facultyName}}`, `{{grade}}`, `{{startDate}}`, `{{endDate}}` placeholders), signature block, colors, and footer note. Saving creates a new template **version** — certificates already issued keep displaying the template they were originally generated with.

---

## Management Panel

### Dashboard
Same key numbers as the Super Admin dashboard (total/issued/pending records, certificates issued this month) plus the latest certificates issued.

### Student Listing
A sortable, paginated table of every student and their certificate status. Use the search box to filter by name, email, phone, or certificate number.

- **View** (eye icon) — preview the certificate PDF inline.
- **Download** — save the PDF.
- **Resend** — re-emails the certificate to the student. If no email server is configured for this environment, the action is simulated and logged (useful for demos without setting up SMTP).

### Search
A dedicated advanced search: filter by certificate number/name, course, faculty, certificate status, and issue date range. Results show the same View/Download/Resend actions as the Student Listing.

---

## Tips

- Every login, certificate generation, search, download, and resend is recorded in the activity log for audit purposes.
- If a course, faculty, or grade you need isn't in a dropdown, ask a Super Admin to add it under **Manage Courses / Faculties / Grades**.
- Certificate numbers are assigned automatically and never repeat — you don't need to (and can't) set one manually.
