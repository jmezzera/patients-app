import { describe, expect, it } from "vitest";

describe("appointments workflow contracts", () => {
  it("expects note payload to include patientId and content", () => {
    const payload = { patientId: "p1", content: "Followed plan" };
    expect(payload.patientId).toBeTruthy();
    expect(payload.content.length).toBeGreaterThan(0);
  });

  it("expects metrics payload to include at least one metric", () => {
    const payload = { metrics: [{ key: "weight", value: "79.5", unit: "kg" }] };
    expect(payload.metrics.length).toBeGreaterThan(0);
  });
});
