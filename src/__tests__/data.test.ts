import { describe, it, expect } from "vitest";
import { INITIAL_PATIENTS } from "../data";

describe("Initial Patients Data Integrity", () => {
  it("should have a non-empty list of initial patients", () => {
    expect(INITIAL_PATIENTS.length).toBeGreaterThan(0);
  });

  it("should have valid patient fields", () => {
    INITIAL_PATIENTS.forEach((patient) => {
      expect(patient.id).toBeDefined();
      expect(patient.id).toMatch(/^PAT-\d+$/);
      expect(patient.firstName).toBeDefined();
      expect(patient.lastName).toBeDefined();
      expect(patient.phone).toBeDefined();
      expect(typeof patient.sensitiveDataSigned).toBe("boolean");
    });
  });

  it("should have unique patient IDs", () => {
    const ids = INITIAL_PATIENTS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
