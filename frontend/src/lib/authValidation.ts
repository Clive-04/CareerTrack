export type RegistrationValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function passwordByteLength(password: string) {
  return new TextEncoder().encode(password).length;
}

export function validateLogin(email: string, password: string) {
  if (!email.trim() || !password) return "Email and password are required.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  if (passwordByteLength(password) > 72) return "Password must be 72 bytes or fewer.";
  return null;
}

export function validateRegistration(values: RegistrationValues) {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (!firstName || !lastName) return "First name and last name are required.";
  if (firstName.length > 100 || lastName.length > 100) return "Names must be 100 characters or fewer.";
  if (!values.email.trim()) return "Email is required.";
  if (!EMAIL_PATTERN.test(values.email.trim())) return "Enter a valid email address.";
  if (!values.password) return "Password is required.";
  if (values.password.length < 12) return "Password must be at least 12 characters.";
  if (passwordByteLength(values.password) > 72) return "Password must be 72 bytes or fewer.";
  if (!values.confirmPassword) return "Please confirm your password.";
  if (values.password !== values.confirmPassword) return "Passwords do not match.";
  return null;
}

