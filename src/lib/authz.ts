import { auth, currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export type SessionActor = {
  id: string;
  clerkId: string;
  orgId: string;
  role: Role;
  patientId: string | null;
};

const DEFAULT_ORG_ID = "org_default";

function parseRole(value: unknown): Role {
  if (typeof value !== "string") {
    return Role.DOCTOR;
  }

  const normalized = value.toUpperCase();
  if (normalized === Role.MANAGER) {
    return Role.MANAGER;
  }
  if (normalized === Role.PATIENT) {
    return Role.PATIENT;
  }

  return Role.DOCTOR;
}

async function ensureLocalUser(clerkId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error("Clerk user has no email address");
  }

  const role = parseRole(clerkUser.publicMetadata?.role);
  const firstName = clerkUser.firstName ?? "User";
  const lastName = clerkUser.lastName ?? "";
  const displayName = `${firstName} ${lastName}`.trim();

  const localUser = await db.user.upsert({
    where: { clerkId },
    update: {
      email: primaryEmail,
      displayName,
    },
    create: {
      clerkId,
      orgId: DEFAULT_ORG_ID,
      role,
      email: primaryEmail,
      displayName,
    },
  });

  if (role === Role.PATIENT) {
    await db.patient.upsert({
      where: { userId: localUser.id },
      update: {
        firstName,
        lastName,
      },
      create: {
        orgId: localUser.orgId,
        userId: localUser.id,
        firstName,
        lastName,
      },
    });
  }
}

export async function getSessionActor(): Promise<SessionActor> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { patientProfile: true },
  });

  if (!user) {
    await ensureLocalUser(userId);
    user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { patientProfile: true },
    });
  }

  if (!user) {
    throw new Error("Unable to initialize local user");
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    orgId: user.orgId,
    role: user.role,
    patientId: user.patientProfile?.id ?? null,
  };
}

export function assertRole(actor: SessionActor, allowed: Role[]) {
  if (!allowed.includes(actor.role)) {
    throw new Error("Forbidden");
  }
}

export function assertPatientScope(actor: SessionActor, patientId: string) {
  if (actor.role === Role.PATIENT && actor.patientId !== patientId) {
    throw new Error("Forbidden");
  }
}
