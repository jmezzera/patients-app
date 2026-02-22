import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { assertPatientScope, assertRole, type SessionActor } from "@/lib/authz";

const baseActor: SessionActor = {
  id: "user_1",
  clerkId: "clerk_1",
  orgId: "org_1",
  role: Role.DOCTOR,
  patientId: null,
};

describe("authz", () => {
  it("allows allowed role", () => {
    expect(() => assertRole(baseActor, [Role.DOCTOR, Role.MANAGER])).not.toThrow();
  });

  it("blocks disallowed role", () => {
    expect(() => assertRole(baseActor, [Role.PATIENT])).toThrow("Forbidden");
  });

  it("enforces patient self-scope", () => {
    const patientActor: SessionActor = { ...baseActor, role: Role.PATIENT, patientId: "p1" };
    expect(() => assertPatientScope(patientActor, "p2")).toThrow("Forbidden");
    expect(() => assertPatientScope(patientActor, "p1")).not.toThrow();
  });
});
