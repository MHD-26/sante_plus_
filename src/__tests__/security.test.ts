import { describe, it, expect, vi } from "vitest";
import { enforceRBAC } from "../utils/rbac";

describe("Role-Based Access Control (RBAC) Security Tests", () => {
  it("should allow access for authorized user roles", async () => {
    const middleware = enforceRBAC(["administrateur", "medecin"]);
    
    // Mock Request
    const req = {
      headers: {
        "x-user-role": "medecin",
        "x-user-email": "medecin@santeplus.ci",
        "x-user-name": "Dr. Koffi"
      },
      method: "GET",
      path: "/api/patients",
      socket: { remoteAddress: "127.0.0.1" }
    } as any;

    // Mock Response
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as any;

    // Mock Next Function
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block access and return 403 for unauthorized user roles", async () => {
    const middleware = enforceRBAC(["administrateur"]);

    // Mock Request (Patient attempting to access admin route)
    const req = {
      headers: {
        "x-user-role": "patient",
        "x-user-email": "patient@santeplus.ci",
        "x-user-name": "Jean Dupont"
      },
      method: "POST",
      path: "/api/staff/create",
      socket: { remoteAddress: "127.0.0.1" }
    } as any;

    // Mock Response
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as any;

    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        rbacError: true,
        error: expect.stringContaining("Accès refusé")
      })
    );
  });

  it("should default to patient role if no role header is supplied and block access", async () => {
    const middleware = enforceRBAC(["administrateur"]);

    // Mock Request with missing headers
    const req = {
      headers: {},
      method: "POST",
      path: "/api/staff/create",
      socket: { remoteAddress: "127.0.0.1" }
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as any;

    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
