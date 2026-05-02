import bcrypt from "bcrypt";

// bcrypt configuration
const SALT_ROUNDS = 10; // 10-12 is good balance between security and performance

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password with bcrypt format ($2b$10$...)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error("Error hashing password");
  }
}

/**
 * Verify a plain text password against a bcrypt hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Bcrypt hash from database
 * @returns boolean indicating if password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    throw new Error("Error verifying password");
  }
}

/**
 * Check if password meets security requirements
 * @param password - Password to validate
 * @returns Object with isValid and message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  // Optional: Add more strength checks
  if (password.length > 72) {
    return {
      isValid: false,
      message: "Password cannot exceed 72 characters (bcrypt limit)",
    };
  }

  // Optional: Check for complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (strength < 2) {
    return {
      isValid: false,
      message:
        "Password should include a mix of letters, numbers, and special characters",
    };
  }

  return {
    isValid: true,
    message: "Password is strong",
  };
}
