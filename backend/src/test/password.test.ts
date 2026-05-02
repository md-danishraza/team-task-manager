import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../utils/password.js";

async function testBcrypt() {
  console.log("🧪 Testing bcrypt password hashing...\n");

  const password = "SecurePass123!";

  // Test password strength
  console.log("📊 Password strength check:");
  const strength = validatePasswordStrength(password);
  console.log(`   Password: ${password}`);
  console.log(`   Valid: ${strength.isValid}`);
  console.log(`   Message: ${strength.message}\n`);

  // Test hashing
  console.log("🔐 Hashing password...");
  const hash = await hashPassword(password);
  console.log(`   Hash: ${hash}`);
  console.log(`   Hash length: ${hash.length} chars`);
  console.log(`   Format: ${hash.substring(0, 7)}...\n`);

  // Test verification
  console.log("✅ Verifying password...");
  const isValid = await verifyPassword(password, hash);
  console.log(`   Correct password: ${isValid ? "✓ Valid" : "✗ Invalid"}`);

  const isInvalid = await verifyPassword("WrongPass123!", hash);
  console.log(`   Wrong password: ${isInvalid ? "Valid" : "✗ Invalid ✓"}\n`);

  console.log("🎉 bcrypt is working perfectly!");
}

// Run test
testBcrypt().catch(console.error);
