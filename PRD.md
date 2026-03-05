# Product Requirements Document
## Nutritionist Practice System of Record

---

## 1. Overview

A system of record for a nutritionist practice. It manages patient profiles, appointments, clinical notes, metrics, and generated assets across three user roles.

---

## 2. Personas

| Persona | Description |
|---|---|
| **Patient** | The practice's client. Can log self-measurements and view their own profile and appointments. |
| **Doctor** | A nutritionist. Manages their schedule, conducts appointments, records notes and metrics, and owns the clinical relationship with patients. |
| **Manager** | Practice administrator. Manages users, schedules, and nutrition plan types. Has the same data access level as doctors. |

---

## 3. Features

### 3.1 Appointments

#### Scheduling
- Appointments are created by **doctors or managers** and are immediately booked (no request/approval flow).
- While scheduling, the scheduler has access to:
  - The doctor's agenda
  - The patient's history and profile
- Appointments may involve **multiple patients**, selected upfront at scheduling time.
- Each patient in a multi-patient appointment has their own independent notes and metrics for that appointment.

#### Lifecycle
```
Booked → Completed | Cancelled
```

#### Doctor Availability
- Doctors configure a **weekly recurring schedule** (working hours per day).
- Doctors can additionally **block arbitrary time slots** on their calendar (e.g., holidays, personal blocks).

#### Notes
- Two visibility types:
  - **Internal** — visible to the doctor only.
  - **Public** — visible to both the doctor and the patient.
- Visibility can be **toggled after creation**.
- Notes are attached to the patient's profile via the appointment.

#### Assets (PDFs)
- Doctors can **manually upload** PDF files during or after an appointment.
- The system provides a set of **predefined templates** (system-managed; no user-facing template editor in v1).
- All assets are attached to the relevant patient's profile.

#### Patient View
- Patients can only see their own appointments and any public notes associated with them.
- Patients never see other patients' appointments on the doctor's calendar — only their own booked slots are visible.
- In multi-patient appointments, co-attendee names are visible, but their profiles are never accessible to other patients.

---

### 3.2 Patient Profile

#### Identity & Attributes
- Name, date of birth, assigned nutrition plan.
- Each patient is assigned to **exactly one doctor** at a time.
- Patients are **onboarded by doctors or managers** (no self-registration).
- Patients can be **transferred** to a different doctor by a doctor or manager.

#### Nutrition Plans
- An enumerated value assigned to a patient.
- New plan types can only be created by **managers**.

#### Metrics
- A metric is a **snapshot in time** of a measurable dimension (e.g., weight, BMI, waist circumference).
- **Doctors can define new metric types.**
- Some metrics are **doctor-only** (can only be recorded by doctors).
- Others can be recorded by **both doctors and patients** via the app.
- Measurements recorded by patients are **visually distinguished** from those recorded by doctors.

#### Visibility
- A patient's profile is visible to:
  - The patient themselves
  - All doctors
  - All managers

#### Visualizations
- **Time series** — metric value over time.
- **Radar chart** — multi-axis comparison across configurable metrics.

---

### 3.3 Statistics & Insights Dashboard

#### Doctor View (personal)
- Each doctor sees stats scoped to their own practice.
- **Appointment statistics:**
  - Total appointments over a user-defined time range
  - Active patient count
- **Trends:**
  - Appointment volume over time
- Per-patient breakdowns are available — a doctor can drill into a specific patient's appointment history and metric trends from this view.

#### Manager View (practice-wide)
- Managers see the same stats aggregated across all doctors.
- Can also view stats broken down per doctor.

#### Time Granularity
- The time range is **user-defined** — users select the start and end date freely.

---

## 4. Access Control Summary

| Capability | Patient | Doctor | Manager |
|---|:---:|:---:|:---:|
| View own profile | ✓ | — | — |
| View any patient profile | — | ✓ | ✓ |
| Log self-measurements | ✓ | — | — |
| Record metrics for patients | — | ✓ | — |
| View own appointments | ✓ | — | — |
| View own schedule | — | ✓ | — |
| Schedule appointments | — | ✓ | ✓ |
| Cancel appointments | — | ✓ | ✓ |
| Write notes | — | ✓ | — |
| Upload/generate PDFs | — | ✓ | — |
| Configure working hours | — | ✓ | — |
| Onboard patients | — | ✓ | ✓ |
| Assign/transfer patients | — | ✓ | ✓ |
| Create nutrition plan types | — | — | ✓ |
| Create metric types | — | ✓ | — |
| View personal statistics | — | ✓ | — |
| View practice-wide statistics | — | — | ✓ |

---

## 5. Out of Scope (v1)

- Push notifications / reminders
- In-app messaging between patients and doctors
- Patient self-registration
- PDF template editor (templates are system-managed)
