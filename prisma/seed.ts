import { PrismaClient, Role, Sex, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();
const orgId = "org_default";

function daysAgo(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Returns the Monday of the current week */
function mondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns a datetime for weekDay (1=Mon…5=Fri) of the current week at a given hour */
function thisWeek(weekDay: 1 | 2 | 3 | 4 | 5, hour: number) {
  const monday = mondayOfCurrentWeek();
  monday.setDate(monday.getDate() + (weekDay - 1));
  monday.setHours(hour, 0, 0, 0);
  return new Date(monday);
}

function slug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function jitter(base: number, range: number) {
  return +(base + (Math.random() * 2 - 1) * range).toFixed(2);
}

// ── 30 patients: [firstName, lastName, sex, planIdx, baseWeight, baseFat, baseWaist, dobYear] ──
const PROFILES: [string, string, Sex, number, number, number, number, number][] = [
  ["Ana",       "Silva",      Sex.FEMALE, 0, 78.4,  31.2, 90.1,  1988],
  ["Bruno",     "Lima",       Sex.MALE,   1, 96.8,  28.9, 105.3, 1982],
  ["Carla",     "Souza",      Sex.FEMALE, 2, 61.5,  22.8, 73.4,  1995],
  ["Diego",     "Mendes",     Sex.MALE,   0, 90.2,  29.7, 100.6, 1979],
  ["Elisa",     "Rocha",      Sex.FEMALE, 3, 70.1,  30.5, 85.7,  1991],
  ["Felipe",    "Costa",      Sex.MALE,   4, 74.6,  19.3, 80.2,  1987],
  ["Gabriela",  "Pires",      Sex.FEMALE, 1, 65.9,  26.4, 80.8,  1993],
  ["Henrique",  "Alves",      Sex.MALE,   0, 103.1, 33.8, 111.4, 1975],
  ["Isabela",   "Nunes",      Sex.FEMALE, 2, 56.3,  20.1, 68.9,  1999],
  ["João",      "Barbosa",    Sex.MALE,   3, 87.5,  26.0, 95.3,  1983],
  ["Karina",    "Ferreira",   Sex.FEMALE, 4, 72.8,  28.7, 87.5,  1990],
  ["Lucas",     "Rodrigues",  Sex.MALE,   0, 83.4,  24.2, 92.8,  1986],
  ["Mariana",   "Oliveira",   Sex.FEMALE, 1, 67.2,  27.9, 82.1,  1994],
  ["Nando",     "Santos",     Sex.MALE,   2, 91.6,  31.5, 104.2, 1978],
  ["Olívia",    "Pereira",    Sex.FEMALE, 3, 59.8,  23.6, 72.0,  1997],
  ["Paulo",     "Gomes",      Sex.MALE,   4, 79.3,  21.8, 87.9,  1984],
  ["Renata",    "Martins",    Sex.FEMALE, 0, 82.1,  34.4, 97.6,  1980],
  ["Samuel",    "Carvalho",   Sex.MALE,   1, 75.7,  22.5, 84.3,  1992],
  ["Tatiane",   "Ribeiro",    Sex.FEMALE, 2, 64.0,  25.8, 77.5,  1989],
  ["Ulisses",   "Azevedo",    Sex.MALE,   3, 98.2,  30.1, 108.8, 1971],
  ["Vanessa",   "Cardoso",    Sex.FEMALE, 4, 69.5,  29.3, 83.9,  1996],
  ["William",   "Nascimento", Sex.MALE,   0, 88.0,  27.6, 97.2,  1985],
  ["Ximena",    "Lopes",      Sex.FEMALE, 1, 55.4,  18.9, 66.7,  2001],
  ["Yago",      "Melo",       Sex.MALE,   2, 93.7,  32.0, 107.1, 1977],
  ["Zara",      "Vieira",     Sex.FEMALE, 3, 71.3,  27.1, 85.0,  1998],
  ["Artur",     "Monteiro",   Sex.MALE,   4, 80.9,  23.4, 90.5,  1988],
  ["Beatriz",   "Fonseca",    Sex.FEMALE, 0, 76.6,  32.7, 92.8,  1981],
  ["Caio",      "Teixeira",   Sex.MALE,   1, 85.1,  25.3, 94.0,  1990],
  ["Débora",    "Cunha",      Sex.FEMALE, 2, 63.4,  24.0, 75.3,  1993],
  ["Eduardo",   "Freitas",    Sex.MALE,   3, 101.4, 35.2, 113.6, 1974],
];

// ── This week's schedule: [weekDay, hour, patientIndex] ─────────────────────
// Mon-Fri, slots at 9, 10, 11, 13, 14, 15 (6 per day = 30 total)
const WEEK_SCHEDULE: [1 | 2 | 3 | 4 | 5, number, number][] = [
  [1, 9,  0],  [1, 10, 1],  [1, 11, 2],  [1, 13, 3],  [1, 14, 4],  [1, 15, 5],
  [2, 9,  6],  [2, 10, 7],  [2, 11, 8],  [2, 13, 9],  [2, 14, 10], [2, 15, 11],
  [3, 9,  12], [3, 10, 13], [3, 11, 14], [3, 13, 15], [3, 14, 16], [3, 15, 17],
  [4, 9,  18], [4, 10, 19], [4, 11, 20], [4, 13, 21], [4, 14, 22], [4, 15, 23],
  [5, 9,  24], [5, 10, 25], [5, 11, 26], [5, 13, 27], [5, 14, 28], [5, 15, 29],
];

async function main() {
  // ── Wipe ────────────────────────────────────────────────────────────────────
  await prisma.auditEvent.deleteMany({ where: { orgId } });
  await prisma.uploadedAsset.deleteMany({ where: { orgId } });
  await prisma.appointmentMetric.deleteMany({ where: { appointment: { orgId } } });
  await prisma.note.deleteMany({ where: { orgId } });
  await prisma.measurementEntry.deleteMany({ where: { orgId } });
  await prisma.appointmentParticipant.deleteMany({ where: { appointment: { orgId } } });
  await prisma.appointment.deleteMany({ where: { orgId } });
  await prisma.patient.deleteMany({ where: { orgId } });
  await prisma.weeklySchedule.deleteMany({ where: { orgId } });
  await prisma.calendarBlock.deleteMany({ where: { orgId } });
  await prisma.metricType.deleteMany({ where: { orgId } });
  await prisma.nutritionPlan.deleteMany({ where: { orgId } });
  await prisma.user.deleteMany({ where: { orgId } });

  // ── Staff ───────────────────────────────────────────────────────────────────
  const manager = await prisma.user.create({
    data: { clerkId: "clerk_manager_seed", orgId, role: Role.MANAGER, email: "manager@jami.app", displayName: "Maria Manager" },
  });

  const doctor = await prisma.user.create({
    data: { clerkId: "clerk_doctor_seed", orgId, role: Role.DOCTOR, email: "doctor@jami.app", displayName: "Daniel Doctor" },
  });

  // ── Nutrition plans ─────────────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.nutritionPlan.create({ data: { orgId, name: "Weight Loss",          createdBy: manager.id } }),
    prisma.nutritionPlan.create({ data: { orgId, name: "Lean Mass Gain",       createdBy: manager.id } }),
    prisma.nutritionPlan.create({ data: { orgId, name: "Metabolic Balance",    createdBy: manager.id } }),
    prisma.nutritionPlan.create({ data: { orgId, name: "Athletic Performance", createdBy: manager.id } }),
    prisma.nutritionPlan.create({ data: { orgId, name: "Gut Health",           createdBy: manager.id } }),
  ]);

  // ── Metric types ────────────────────────────────────────────────────────────
  const [mtWeight, mtBodyFat, mtWaist, mtHR, mtSleep, mtHunger] = await Promise.all([
    prisma.metricType.create({ data: { orgId, name: "Weight",              unit: "kg",    doctorOnly: false, createdBy: doctor.id } }),
    prisma.metricType.create({ data: { orgId, name: "Body Fat",            unit: "%",     doctorOnly: false, createdBy: doctor.id } }),
    prisma.metricType.create({ data: { orgId, name: "Waist Circumference", unit: "cm",    doctorOnly: false, createdBy: doctor.id } }),
    prisma.metricType.create({ data: { orgId, name: "Resting HR",          unit: "bpm",   doctorOnly: true,  createdBy: doctor.id } }),
    prisma.metricType.create({ data: { orgId, name: "Sleep Score",         unit: "pts",   doctorOnly: true,  createdBy: doctor.id } }),
    prisma.metricType.create({ data: { orgId, name: "Hunger Score",        unit: "0-10",  doctorOnly: true,  createdBy: doctor.id } }),
  ]);

  // ── Doctor working hours (Mon–Fri 09:00–18:00) ──────────────────────────────
  await prisma.weeklySchedule.createMany({
    data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      orgId, userId: doctor.id, dayOfWeek, startTime: "09:00", endTime: "18:00",
    })),
  });

  // ── Calendar block: lunch Mon–Fri 12:00–13:00 ───────────────────────────────
  for (let wd = 1; wd <= 5; wd++) {
    await prisma.calendarBlock.create({
      data: {
        orgId, doctorId: doctor.id,
        startsAt: thisWeek(wd as 1 | 2 | 3 | 4 | 5, 12),
        endsAt: thisWeek(wd as 1 | 2 | 3 | 4 | 5, 13),
        reason: "Lunch break",
      },
    });
  }

  // ── Create all patients first ────────────────────────────────────────────────
  const patients: Awaited<ReturnType<typeof prisma.patient.create>>[] = [];
  const patientUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];

  for (const [i, [firstName, lastName, sex, planIdx, , , , dobYear]] of PROFILES.entries()) {
    const pu = await prisma.user.create({
      data: {
        clerkId: `clerk_patient_${i}_seed`,
        orgId,
        role: Role.PATIENT,
        email: `${slug(firstName)}.${slug(lastName)}.${i}@jami.app`,
        displayName: `${firstName} ${lastName}`,
      },
    });
    const p = await prisma.patient.create({
      data: {
        orgId,
        userId: pu.id,
        assignedDoctorId: doctor.id,
        nutritionPlanId: plans[planIdx].id,
        firstName,
        lastName,
        sex,
        phone: `+55 11 9${String(80000 + i).slice(-5)}-${String(1000 + i).slice(-4)}`,
        clinicalSummary: "Active follow-up in clinic nutrition program.",
        dob: new Date(dobYear, (i * 3) % 12, 1 + (i % 28)),
      },
    });
    patients.push(p);
    patientUsers.push(pu);
  }

  // ── Historical appointments (2 COMPLETED per patient, ~5 and ~10 weeks ago) ─
  const histAppts: { a1: typeof patients[0] extends infer _ ? Awaited<ReturnType<typeof prisma.appointment.create>> : never; a2: typeof patients[0] extends infer _ ? Awaited<ReturnType<typeof prisma.appointment.create>> : never; patient: typeof patients[0]; patientUser: typeof patientUsers[0] }[] = [];

  for (const [i, patient] of patients.entries()) {
    const [firstName, lastName, , , baseWeight, baseFat, baseWaist] = PROFILES[i];
    const patientUser = patientUsers[i];

    const hour1 = 9 + (i % 6) + (i % 2 === 0 ? 0 : 4); // vary appointment hours
    const hour2 = 9 + ((i + 1) % 6) + (i % 2 === 0 ? 4 : 0);

    // First completed appointment ~10 weeks ago
    const a1 = await prisma.appointment.create({
      data: {
        orgId,
        doctorId: doctor.id,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: daysAgo(70, hour1),
        completedAt: daysAgo(70, hour1),
        participants: { create: { patientId: patient.id } },
      },
    });

    // Second completed appointment ~5 weeks ago
    const a2 = await prisma.appointment.create({
      data: {
        orgId,
        doctorId: doctor.id,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: daysAgo(35, hour2),
        completedAt: daysAgo(35, hour2),
        participants: { create: { patientId: patient.id } },
      },
    });

    // Metrics at first appointment
    await prisma.appointmentMetric.createMany({
      data: [
        { appointmentId: a1.id, patientId: patient.id, metricTypeId: mtHR.id,     value: String(62 + (i % 18)) },
        { appointmentId: a1.id, patientId: patient.id, metricTypeId: mtSleep.id,  value: String(68 + (i % 22)) },
        { appointmentId: a1.id, patientId: patient.id, metricTypeId: mtHunger.id, value: String(3 + (i % 6)) },
      ],
    });

    // Metrics at second appointment (slight improvement)
    await prisma.appointmentMetric.createMany({
      data: [
        { appointmentId: a2.id, patientId: patient.id, metricTypeId: mtHR.id,     value: String(60 + (i % 16)) },
        { appointmentId: a2.id, patientId: patient.id, metricTypeId: mtSleep.id,  value: String(72 + (i % 20)) },
        { appointmentId: a2.id, patientId: patient.id, metricTypeId: mtHunger.id, value: String(2 + (i % 5)) },
      ],
    });

    // Notes on second appointment
    const pubNote = await prisma.note.create({
      data: {
        orgId, patientId: patient.id, appointmentId: a2.id, authorId: doctor.id,
        isPublic: true,
        content: "Good adherence to the protocol. Continue current meal structure and maintain protein target. Next appointment in 5 weeks.",
      },
    });
    await prisma.note.create({
      data: {
        orgId, patientId: patient.id, authorId: doctor.id,
        isPublic: false,
        content: "Patient reports difficulty on weekends. Suggested simplified plan for Sat/Sun. Monitor closely.",
      },
    });

    // 16 measurement entries (every ~5 days over 80 days), 3 metrics each
    const measurements = Array.from({ length: 16 }).flatMap((_, t) => {
      const isSelf = t % 3 !== 0;
      const source = isSelf ? "patient_self" : "doctor_visit";
      const recorderId = isSelf ? patientUser.id : doctor.id;
      const apptId = t === 5 ? a1.id : t === 11 ? a2.id : null;
      const measuredAt = daysAgo(80 - t * 5, 8 + (t % 4));
      const decay = t * 0.22;
      return [
        { orgId, patientId: patient.id, recorderUserId: recorderId, appointmentId: apptId, metricTypeId: mtWeight.id, source, measuredAt, value: +jitter(baseWeight - decay, 0.5), notes: isSelf ? "Self-tracked" : null },
        { orgId, patientId: patient.id, recorderUserId: recorderId, appointmentId: apptId, metricTypeId: mtBodyFat.id, source, measuredAt, value: +jitter(baseFat - decay * 0.7, 0.3), notes: null },
        { orgId, patientId: patient.id, recorderUserId: recorderId, appointmentId: apptId, metricTypeId: mtWaist.id, source, measuredAt, value: +jitter(baseWaist - decay * 1.5, 0.8), notes: null },
      ];
    });
    await prisma.measurementEntry.createMany({ data: measurements });

    // Asset attached to second appointment
    const asset = await prisma.uploadedAsset.create({
      data: {
        orgId, patientId: patient.id, appointmentId: a2.id, uploadedById: doctor.id,
        kind: "plan",
        fileKey: `seed-${patient.id}-plan.pdf`,
        fileName: `${slug(firstName)}-${slug(lastName)}-nutrition-plan.pdf`,
        fileUrl: `https://example.com/assets/${patient.id}/nutrition-plan.pdf`,
        fileSize: 204800 + i * 1024,
      },
    });

    await prisma.auditEvent.createMany({
      data: [
        { orgId, actorId: doctor.id, action: "note.create",   entityType: "note",           entityId: pubNote.id, afterJson: pubNote },
        { orgId, actorId: doctor.id, action: "asset.upload",  entityType: "uploaded_asset", entityId: asset.id,   afterJson: asset },
      ],
    });

    histAppts.push({ a1, a2, patient, patientUser });
  }

  // ── This week's appointments (1 per patient, Mon-Fri) ───────────────────────
  for (const [weekDay, hour, patientIdx] of WEEK_SCHEDULE) {
    const patient = patients[patientIdx];
    const scheduledAt = thisWeek(weekDay, hour);
    const isToday = scheduledAt.toDateString() === new Date().toDateString();
    const isPast = scheduledAt < new Date();

    const status = isPast && !isToday ? AppointmentStatus.COMPLETED : AppointmentStatus.BOOKED;

    const appt = await prisma.appointment.create({
      data: {
        orgId,
        doctorId: doctor.id,
        status,
        scheduledAt,
        completedAt: status === AppointmentStatus.COMPLETED ? scheduledAt : null,
        participants: { create: { patientId: patient.id } },
      },
    });

    if (status === AppointmentStatus.COMPLETED) {
      const [, , , , baseWeight, baseFat, baseWaist] = PROFILES[patientIdx];
      const decay = 16 * 0.22 + 0.5; // improvement beyond history
      await prisma.appointmentMetric.createMany({
        data: [
          { appointmentId: appt.id, patientId: patient.id, metricTypeId: mtHR.id,     value: String(58 + (patientIdx % 14)) },
          { appointmentId: appt.id, patientId: patient.id, metricTypeId: mtSleep.id,  value: String(76 + (patientIdx % 18)) },
          { appointmentId: appt.id, patientId: patient.id, metricTypeId: mtHunger.id, value: String(2 + (patientIdx % 4)) },
        ],
      });
      await prisma.measurementEntry.createMany({
        data: [
          { orgId, patientId: patient.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtWeight.id,  source: "doctor_visit", measuredAt: scheduledAt, value: +jitter(PROFILES[patientIdx][4] - decay, 0.3), notes: "Clinic weigh-in" },
          { orgId, patientId: patient.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtBodyFat.id, source: "doctor_visit", measuredAt: scheduledAt, value: +jitter(PROFILES[patientIdx][5] - decay * 0.7, 0.2), notes: null },
          { orgId, patientId: patient.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtWaist.id,   source: "doctor_visit", measuredAt: scheduledAt, value: +jitter(PROFILES[patientIdx][6] - decay * 1.5, 0.5), notes: null },
        ],
      });
    }
  }

  // ── One multi-patient group appointment next Monday ──────────────────────────
  const nextMon = daysFromNow(7 - new Date().getDay() + 1, 16);
  const groupAppt = await prisma.appointment.create({
    data: {
      orgId, doctorId: doctor.id,
      status: AppointmentStatus.BOOKED,
      scheduledAt: nextMon,
      participants: {
        create: [
          { patientId: patients[0].id },
          { patientId: patients[1].id },
          { patientId: patients[2].id },
        ],
      },
    },
  });
  await prisma.note.create({
    data: {
      orgId, patientId: patients[0].id, appointmentId: groupAppt.id, authorId: doctor.id,
      isPublic: false,
      content: "Group session — review shared meal planning strategies.",
    },
  });

  // ── Detailed showcase patient: Sofia Andrade (2 years of data) ──────────────
  const sofiaUser = await prisma.user.create({
    data: {
      clerkId: "clerk_sofia_seed",
      orgId,
      role: Role.PATIENT,
      email: "sofia.andrade@jami.app",
      displayName: "Sofia Andrade",
    },
  });
  const sofia = await prisma.patient.create({
    data: {
      orgId,
      userId: sofiaUser.id,
      assignedDoctorId: doctor.id,
      nutritionPlanId: plans[0].id, // Weight Loss
      firstName: "Sofia",
      lastName: "Andrade",
      sex: Sex.FEMALE,
      phone: "+55 11 99999-0001",
      color: "#a855f7",
      clinicalSummary:
        "Two-year weight-loss program. Excellent adherence. Started at 102 kg, target 82 kg. Ongoing monthly follow-up.",
      dob: new Date(1989, 3, 12),
    },
  });

  // Sofia's trajectory: 24 months, weight 102 → 84 kg, fat 38 → 24%, waist 112 → 90 cm
  // HR 78 → 62 bpm (improving fitness), sleep 55 → 82 pts, hunger 8 → 3 pts
  const sofiaAppts: Awaited<ReturnType<typeof prisma.appointment.create>>[] = [];
  const MONTHS = 24;

  for (let m = 0; m < MONTHS; m++) {
    const daysBack = (MONTHS - m) * 30 - 5; // oldest first
    const progress = m / (MONTHS - 1); // 0 → 1

    const scheduledAt = daysAgo(daysBack, 10);
    const isPast = scheduledAt < new Date();
    const status = isPast ? AppointmentStatus.COMPLETED : AppointmentStatus.BOOKED;

    const appt = await prisma.appointment.create({
      data: {
        orgId,
        doctorId: doctor.id,
        status,
        scheduledAt,
        completedAt: isPast ? scheduledAt : null,
        participants: { create: { patientId: sofia.id } },
      },
    });
    sofiaAppts.push(appt);

    if (!isPast) continue;

    // Doctor measurements at each appointment (all 6 metrics)
    const drWeight  = jitter(102 - progress * 18, 0.4);
    const drFat     = jitter(38  - progress * 14, 0.3);
    const drWaist   = jitter(112 - progress * 22, 0.6);
    const drHR      = jitter(78  - progress * 16, 1.5);
    const drSleep   = jitter(55  + progress * 27, 2.0);
    const drHunger  = jitter(8   - progress * 5,  0.5);

    await prisma.measurementEntry.createMany({
      data: [
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtWeight.id,  source: "doctor_visit", measuredAt: scheduledAt, value: drWeight, notes: "Clinic scale" },
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtBodyFat.id, source: "doctor_visit", measuredAt: scheduledAt, value: drFat,    notes: null },
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtWaist.id,   source: "doctor_visit", measuredAt: scheduledAt, value: drWaist,  notes: null },
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtHR.id,      source: "doctor_visit", measuredAt: scheduledAt, value: drHR,     notes: null },
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtSleep.id,   source: "doctor_visit", measuredAt: scheduledAt, value: drSleep,  notes: null },
        { orgId, patientId: sofia.id, recorderUserId: doctor.id, appointmentId: appt.id, metricTypeId: mtHunger.id,  source: "doctor_visit", measuredAt: scheduledAt, value: drHunger, notes: null },
      ],
    });

    // Doctor note every appointment
    if (m % 3 === 0) {
      await prisma.note.create({
        data: {
          orgId, patientId: sofia.id, appointmentId: appt.id, authorId: doctor.id,
          isPublic: true,
          content: m === 0
            ? "Initial consultation. Setting baseline metrics, starting Weight Loss protocol."
            : `Month ${m} review. Weight loss on track. Continue current plan and maintain activity level.`,
        },
      });
    }
  }

  // Sofia's self-measurements: every ~14 days for the past 2 years (weight, fat, waist only)
  const selfDays = MONTHS * 30;
  for (let d = selfDays; d > 0; d -= 14) {
    const progress = 1 - d / selfDays;
    const measuredAt = daysAgo(d, 7 + Math.floor(Math.random() * 4));
    const sWeight = jitter(102 - progress * 18, 1.2);
    const sFat    = jitter(38  - progress * 14, 0.8);
    const sWaist  = jitter(112 - progress * 22, 1.5);
    await prisma.measurementEntry.createMany({
      data: [
        { orgId, patientId: sofia.id, recorderUserId: sofiaUser.id, metricTypeId: mtWeight.id,  source: "patient_self", measuredAt, value: sWeight, notes: "Home scale" },
        { orgId, patientId: sofia.id, recorderUserId: sofiaUser.id, metricTypeId: mtBodyFat.id, source: "patient_self", measuredAt, value: sFat,    notes: null },
        { orgId, patientId: sofia.id, recorderUserId: sofiaUser.id, metricTypeId: mtWaist.id,   source: "patient_self", measuredAt, value: sWaist,  notes: null },
      ],
    });
  }

  console.log("✓ Seed complete", {
    manager: manager.email,
    doctor: doctor.email,
    patients: patients.length,
    plans: plans.length,
    weekSlots: WEEK_SCHEDULE.length,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
