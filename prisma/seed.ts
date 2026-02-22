import { PrismaClient, Role, Sex } from "@prisma/client";

const prisma = new PrismaClient();

const orgId = "org_default";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function slug(input: string) {
  return input.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  await prisma.auditEvent.deleteMany({ where: { orgId } });
  await prisma.uploadedAsset.deleteMany({ where: { orgId } });
  await prisma.appointmentMetric.deleteMany({ where: { appointment: { orgId } } });
  await prisma.doctorNote.deleteMany({ where: { orgId } });
  await prisma.internalNote.deleteMany({ where: { orgId } });
  await prisma.measurementEntry.deleteMany({ where: { orgId } });
  await prisma.appointment.deleteMany({ where: { orgId } });
  await prisma.patient.deleteMany({ where: { orgId } });
  await prisma.user.deleteMany({ where: { orgId } });

  const manager = await prisma.user.create({
    data: {
      clerkId: "clerk_manager_seed",
      orgId,
      role: Role.MANAGER,
      email: "manager@jami.app",
      displayName: "Maria Manager",
    },
  });

  const doctor = await prisma.user.create({
    data: {
      clerkId: "clerk_doctor_seed",
      orgId,
      role: Role.DOCTOR,
      email: "doctor@jami.app",
      displayName: "Daniel Doctor",
    },
  });

  const profiles = [
    ["Anna", "Silva", Sex.FEMALE, "Improve body composition and sleep quality", 81.2, 33.8, 94.4],
    ["Bruno", "Lima", Sex.MALE, "Reduce visceral fat and improve blood pressure", 98.6, 29.4, 108.1],
    ["Carla", "Souza", Sex.FEMALE, "Gain lean mass with structured meal timing", 59.3, 21.5, 71.2],
    ["Diego", "Mendes", Sex.MALE, "Stabilize glucose and reduce cravings", 92.1, 30.2, 102.8],
    ["Elisa", "Rocha", Sex.FEMALE, "Postpartum recovery and energy management", 72.4, 32.1, 88.0],
    ["Felipe", "Costa", Sex.MALE, "Prepare for half-marathon with nutrition periodization", 76.2, 18.8, 79.4],
    ["Gabriela", "Pires", Sex.FEMALE, "Improve digestive symptoms and consistency", 67.5, 27.0, 82.5],
    ["Henrique", "Alves", Sex.MALE, "Weight loss and liver marker improvement", 104.0, 34.1, 112.2],
    ["Isabela", "Nunes", Sex.FEMALE, "Strength gain while preserving low body fat", 57.8, 19.9, 69.4],
    ["Joao", "Barbosa", Sex.MALE, "Reduce LDL and improve meal adherence", 88.7, 26.7, 96.8],
  ].map((row, index) => {
    const [firstName, lastName, sex, nutritionGoal, baseWeight, baseFat, baseWaist] = row;
    return {
      clerkId: `clerk_patient_${slug(String(firstName))}_${slug(String(lastName))}`,
      email: `${slug(String(firstName))}.${slug(String(lastName))}@jami.app`,
      displayName: `${firstName} ${lastName}`,
      firstName: String(firstName),
      lastName: String(lastName),
      phone: `+55 11 90000-${String(1100 + index).slice(-4)}`,
      nutritionGoal: String(nutritionGoal),
      clinicalSummary: "Active nutrition follow-up in clinic program.",
      sex: sex as Sex,
      dob: new Date(1985 + (index % 12), (index * 2) % 12, 3 + index),
      baseWeight: Number(baseWeight),
      baseFat: Number(baseFat),
      baseWaist: Number(baseWaist),
    };
  });

  for (const profile of profiles) {
    const patientUser = await prisma.user.create({
      data: {
        clerkId: profile.clerkId,
        orgId,
        role: Role.PATIENT,
        email: profile.email,
        displayName: profile.displayName,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        orgId,
        userId: patientUser.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        nutritionGoal: profile.nutritionGoal,
        clinicalSummary: profile.clinicalSummary,
        sex: profile.sex,
        dob: profile.dob,
      },
    });

    const completedAppointmentA = await prisma.appointment.create({
      data: {
        orgId,
        patientId: patient.id,
        scheduledAt: daysAgo(35),
        completedAt: daysAgo(35),
      },
    });

    const completedAppointmentB = await prisma.appointment.create({
      data: {
        orgId,
        patientId: patient.id,
        scheduledAt: daysAgo(14),
        completedAt: daysAgo(14),
      },
    });

    const followUpAppointment = await prisma.appointment.create({
      data: {
        orgId,
        patientId: patient.id,
        scheduledAt: daysFromNow(7 + (Math.floor(Math.random() * 4) * 7)),
      },
    });

    const secondFutureAppointment = await prisma.appointment.create({
      data: {
        orgId,
        patientId: patient.id,
        scheduledAt: daysFromNow(30 + (Math.floor(Math.random() * 3) * 7)),
      },
    });

    await prisma.appointmentMetric.createMany({
      data: [
        {
          appointmentId: completedAppointmentA.id,
          key: "resting_hr",
          value: String(64 + Math.floor(Math.random() * 12)),
          unit: "bpm",
        },
        {
          appointmentId: completedAppointmentA.id,
          key: "sleep_score",
          value: String(72 + Math.floor(Math.random() * 18)),
          unit: "pts",
        },
        {
          appointmentId: completedAppointmentB.id,
          key: "hunger_score",
          value: String(3 + Math.floor(Math.random() * 4)),
          unit: "0-10",
        },
      ],
    });

    const doctorNote = await prisma.doctorNote.create({
      data: {
        orgId,
        patientId: patient.id,
        appointmentId: completedAppointmentB.id,
        authorId: doctor.id,
        content:
          "Patient followed meal structure in 80% of days. Maintain protein target and hydration routine.",
      },
    });

    const internalNote = await prisma.internalNote.create({
      data: {
        orgId,
        patientId: patient.id,
        authorId: doctor.id,
        content: "Discuss adherence barriers during next visit and simplify weekend plan.",
      },
    });

    await prisma.measurementEntry.createMany({
      data: Array.from({ length: 12 }).map((_, index) => ({
        orgId,
        patientId: patient.id,
        recorderUserId: index % 2 === 0 ? patientUser.id : doctor.id,
        appointmentId:
          index === 4
            ? completedAppointmentA.id
            : index === 8
              ? completedAppointmentB.id
              : null,
        source: index % 2 === 0 ? "patient_self" : "doctor_visit",
        measuredAt: daysAgo((12 - index) * 6),
        weightKg: Number((profile.baseWeight - index * 0.28).toFixed(2)),
        bodyFatPct: Number((profile.baseFat - index * 0.18).toFixed(2)),
        waistCm: Number((profile.baseWaist - index * 0.4).toFixed(2)),
        notes: index % 2 === 0 ? "Self-tracked at home" : "Clinic follow-up check",
      })),
    });

    const uploadedAsset = await prisma.uploadedAsset.create({
      data: {
        orgId,
        patientId: patient.id,
        appointmentId: completedAppointmentB.id,
        uploadedById: doctor.id,
        kind: "plan",
        fileKey: `seed-${patient.id}-nutrition-plan.pdf`,
        fileName: `${profile.firstName.toLowerCase()}-${profile.lastName.toLowerCase()}-nutrition-plan.pdf`,
        fileUrl: `https://example.com/assets/${patient.id}/nutrition-plan.pdf`,
        fileSize: 214000,
      },
    });

    await prisma.auditEvent.createMany({
      data: [
        {
          orgId,
          actorId: doctor.id,
          action: "doctor_note.create",
          entityType: "doctor_note",
          entityId: doctorNote.id,
          afterJson: doctorNote,
        },
        {
          orgId,
          actorId: doctor.id,
          action: "internal_note.create",
          entityType: "internal_note",
          entityId: internalNote.id,
          afterJson: internalNote,
        },
        {
          orgId,
          actorId: doctor.id,
          action: "asset.upload",
          entityType: "uploaded_asset",
          entityId: uploadedAsset.id,
          afterJson: uploadedAsset,
        },
        {
          orgId,
          actorId: manager.id,
          action: "appointment.create",
          entityType: "appointment",
          entityId: followUpAppointment.id,
          afterJson: followUpAppointment,
        },
        {
          orgId,
          actorId: manager.id,
          action: "appointment.create",
          entityType: "appointment",
          entityId: secondFutureAppointment.id,
          afterJson: secondFutureAppointment,
        },
      ],
    });
  }

  console.log("Seed complete", {
    manager: manager.email,
    doctor: doctor.email,
    patients: profiles.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
