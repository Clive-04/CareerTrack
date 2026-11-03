import { describe, expect, it } from "vitest";
import { passwordByteLength, validateLogin, validateRegistration } from "@/lib/authValidation";

const validRegistration = {
  firstName: "Clive",
  lastName: "Tester",
  email: "clive@example.com",
  password: "correct-password",
  confirmPassword: "correct-password",
};

describe("authentication validation", () => {
  it("accepts valid login and registration values", () => {
    expect(validateLogin("clive@example.com", "password")).toBeNull();
    expect(validateRegistration(validRegistration)).toBeNull();
  });

  it("rejects invalid registration details", () => {
    expect(validateRegistration({ ...validRegistration, firstName: "" })).toBe("First name and last name are required.");
    expect(validateRegistration({ ...validRegistration, email: "invalid" })).toBe("Enter a valid email address.");
    expect(validateRegistration({ ...validRegistration, password: "short", confirmPassword: "short" })).toBe("Password must be at least 12 characters.");
    expect(validateRegistration({ ...validRegistration, confirmPassword: "different-password" })).toBe("Passwords do not match.");
  });

  it("measures UTF-8 password bytes to match bcrypt's limit", () => {
    expect(passwordByteLength("a".repeat(72))).toBe(72);
    expect(passwordByteLength("é".repeat(36))).toBe(72);
    expect(validateRegistration({ ...validRegistration, password: "é".repeat(37), confirmPassword: "é".repeat(37) })).toBe("Password must be 72 bytes or fewer.");
  });
});
