# Technical Requirements Document
## Nutritionist Practice System of Record

---

## 1. Technology Stack

### Retained from Prototype

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.1.6 |
| Language | TypeScript (strict) | 5.7.3 |
| UI | React + shadcn/ui + Tailwind CSS | 19 / latest / 3.4 |
| ORM | Prisma | 6.3.0 |
| Database | PostgreSQL via Neon (serverless) | — |
| Auth | Clerk | 6.14.0 |
| File uploads | UploadThing | 7.4.4 |
| Charts | Recharts | 2.15.1 |
| Validation | Zod | 3.24.1 |
| Testing | Vitest | 3.0.4 |
| Package manager | pnpm | — |

### Suggested Additions

| Addition | Reason |
|---|---|
| **TanStack Query** (`@tanstack/react-query`) | The statistics dashboard and metric visualizations require client-side data fetching with caching, loading states, and refetch on focus. Server components alone are insufficient for interactive, filter-driven views. |
| **date-fns-tz** | Doctor availability and appointment scheduling require timezone-aware date handling. `date-fns` alone does not handle timezone conversions reliably. |

---

## 2. Data Model

The prototype schema is a good foundation. The following changes are required to fully support the PRD.

### 2.1 New Entities

#### `NutritionPlan`
Replaces the current free-text `nutritionGoals` field on `Patient`. Plans are enumerated values managed by managers.

```
NutritionPlan
  id        String   @id
  name      String   @unique
  createdBy String   (userId)
  createdAt DateTime
  orgId     String
```

#### `MetricType`
Replaces hardcoded metric keys on `AppointmentMetric` and `MeasurementEntry`. Doctors define new types.

```
MetricType
  id            String   @id
  name          String
  unit          String?  (e.g. "kg", "mmHg")
  doctorOnly    Boolean  @default(false)
  createdBy     String   (userId / doctor)
  createdAt     DateTime
  orgId         String
```

#### `WorkingHours`
Recurring weekly availability per doctor.

```
WorkingHours
  id        String   @id
  doctorId  String
  dayOfWeek Int      (0 = Sunday … 6 = Saturday)
  startTime String   (HH:MM)
  endTime   String   (HH:MM)
  orgId     String
```

#### `CalendarBlock`
Arbitrary blocked time on a doctor's calendar.

```
CalendarBlock
  id        String   @id
  doctorId  String
  startsAt  DateTime
  endsAt    DateTime
  reason    String?
  orgId     String
```

### 2.2 Schema Modifications

| Entity | Change |
|---|---|
| `Patient` | Replace `nutritionGoals: String` with `nutritionPlanId: String?` → FK to `NutritionPlan` |
| `AppointmentMetric` | Replace free-text `key` with `metricTypeId: String` → FK to `MetricType` |
| `MeasurementEntry` | Replace free-text `type` with `metricTypeId: String` → FK to `MetricType` |
| `DoctorNote` | Add `isPublic: Boolean @default(true)` to support visibility toggling (currently split into two tables — consolidate into one with a visibility flag) |
| `Appointment` | Add `status: AppointmentStatus @default(BOOKED)` enum (`BOOKED`, `COMPLETED`, `CANCELLED`) if not already present |

### 2.3 Unchanged / Already Correct

- `UploadedAsset` — file attachment model is sufficient; seed with system templates.
- `AuditEvent` — immutable audit trail is retained as-is.
- `User` / Clerk sync — role enum (`MANAGER`, `DOCTOR`, `PATIENT`) is correct.
- `org_default` single-org model — appropriate for v1.

---

## 3. Authorization

The existing `src/lib/authz.ts` RBAC layer is retained. The following rules are added or clarified:

| Rule | Detail |
|---|---|
| Note visibility | A note with `isPublic: false` is only returned to the authoring doctor and managers. Patients never receive it. |
| MetricType creation | Only doctors may create `MetricType` records. `doctorOnly` flag controls who can record values. |
| NutritionPlan creation | Only managers may create `NutritionPlan` records. |
| CalendarBlock / WorkingHours | Scoped to the owning doctor. Managers have read access for scheduling. |
| Statistics endpoints | Doctors may only query stats scoped to their own `userId`. Managers may query all or filter by doctor. |
| PDF assets | Patients can read assets attached to their own profile. They cannot list or access other patients' assets. |

---

## 4. API Surface

New route handlers required (all under `/api`):

### Scheduling & Availability
| Method | Route | Description |
|---|---|---|
| GET | `/api/doctors/[id]/working-hours` | Fetch recurring schedule |
| PUT | `/api/doctors/[id]/working-hours` | Replace full weekly schedule |
| GET | `/api/doctors/[id]/calendar-blocks` | Fetch blocked slots |
| POST | `/api/doctors/[id]/calendar-blocks` | Create a block |
| DELETE | `/api/doctors/[id]/calendar-blocks/[blockId]` | Remove a block |

### Nutrition Plans
| Method | Route | Description |
|---|---|---|
| GET | `/api/nutrition-plans` | List all plans (org-scoped) |
| POST | `/api/nutrition-plans` | Create plan (manager only) |

### Metric Types
| Method | Route | Description |
|---|---|---|
| GET | `/api/metric-types` | List all types (org-scoped) |
| POST | `/api/metric-types` | Create type (doctor only) |

### Statistics
| Method | Route | Description |
|---|---|---|
| GET | `/api/stats/appointments` | Appointment counts, filterable by doctorId + date range |
| GET | `/api/stats/patients` | Active patient counts, filterable by doctorId |
| GET | `/api/stats/metric-trends` | Aggregate metric trends across a doctor's patient panel |

All new endpoints follow existing conventions: Zod input validation, authz assertions, AuditEvent recording on mutations, JSON response.

---

## 5. Frontend

### New Pages / Views

| Route | Persona | Description |
|---|---|---|
| `/schedule` | Doctor, Manager | Appointment scheduling UI — shows doctor calendar + patient history side by side |
| `/doctors/[id]/availability` | Doctor | Configure working hours and calendar blocks |
| `/nutrition-plans` | Manager | Manage nutrition plan types |
| `/metric-types` | Doctor | Manage metric type definitions |
| `/stats` | Doctor, Manager | Statistics & insights dashboard |

### Updated Views

| View | Change |
|---|---|
| Patient profile | Replace nutrition goals text field with `NutritionPlan` dropdown |
| Appointment detail | Add appointment status control (Complete / Cancel) |
| Notes section | Consolidate `DoctorNote` + `InternalNote` into a single list with a visibility toggle per note |
| Metric charts | Add radar chart (axes = configurable `MetricType` selection) alongside existing time series |

### Visualization Library

Recharts (already included) supports both time series and radar charts natively — no additional charting library needed.

---

## 6. File Uploads

UploadThing is retained. The current 8 MB per file limit is sufficient for most clinical PDFs; revisit if large imaging reports are added later.

**PDF templates** are seeded as `UploadedAsset` records with a `isTemplate: Boolean` flag (or a separate `source` enum). Templates are system-owned (no `patientId`), and doctors can instantiate them by copying the asset and attaching it to a patient.

---

## 7. Testing

- Continue using **Vitest** for unit tests.
- Repository-layer functions are the primary unit test target (authorization rules, data scoping).
- Add integration tests for new stat aggregation queries.
- No E2E test framework in v1.

---

## 8. Out of Scope (v1)

Consistent with the PRD:

- Push notifications
- In-app messaging
- Patient self-registration
- PDF template editor UI (templates are seeded data)
- Multi-org / multi-practice tenancy
- Timezone-aware scheduling UI (appointment times stored in UTC; display conversion deferred)
