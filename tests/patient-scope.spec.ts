import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { assertPatientScope, type SessionActor } from "@/lib/authz";

describe("patient scope", () => {
  it("does not restrict doctor patient lookups", () => {
    const actor: SessionActor = {
      id: "doc_1",
      clerkId: "clerk_doc",
      orgId: "org_1",
      role: Role.DOCTOR,
      patientId: null,
    };

    expect(() => assertPatientScope(actor, "patient_1")).not.toThrow();
  });

  it("restricts patient to own id", () => {
    const actor: SessionActor = {
      id: "pat_user",
      clerkId: "clerk_pat",
      orgId: "org_1",
      role: Role.PATIENT,
      patientId: "patient_1",
    };

    expect(() => assertPatientScope(actor, "patient_2")).toThrow();
  });
});
