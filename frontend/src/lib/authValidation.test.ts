import { describe, expect, it } from "vitest";
import { passwordByteLength, validateLogin, validateRegistration } from "@/lib/authValidation";

const validRegistration = {
  firstName: "Clive",
  lastName: "Tester",
  email: "clive@example.com",
  password: "Correct-password",
  confirmPassword: "Correct-password",
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
    expect(validateRegistration({ ...validRegistration, password: "lowercase-only!", confirmPassword: "lowercase-only!" })).toBe("Password must include an uppercase letter.");
    expect(validateRegistration({ ...validRegistration, password: "UPPERCASE-ONLY!", confirmPassword: "UPPERCASE-ONLY!" })).toBe("Password must include a lowercase letter.");
    expect(validateRegistration({ ...validRegistration, password: "NoSpecialCharacter", confirmPassword: "NoSpecialCharacter" })).toBe("Password must include a special character.");
    expect(validateRegistration({ ...validRegistration, confirmPassword: "different-password" })).toBe("Passwords do not match.");
  });

  it("measures UTF-8 password bytes to match bcrypt's limit", () => {
    expect(passwordByteLength("a".repeat(72))).toBe(72);
    expect(passwordByteLength("é".repeat(36))).toBe(72);
    const longPassword = `Aa!${"é".repeat(36)}`;
    expect(validateRegistration({ ...validRegistration, password: longPassword, confirmPassword: longPassword })).toBe("Password is too long.");
  });
});
