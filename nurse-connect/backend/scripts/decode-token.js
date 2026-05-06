/**
 * Debug: Decode the stored JWT token and show its payload
 * Run: node scripts/decode-token.js <token>
 */
import jwt from "jsonwebtoken";
import "dotenv/config";

const token = process.argv[2];
if (!token) {
  console.log("Usage: node scripts/decode-token.js <jwt_token>");
  console.log("\nDecoding without verification (to inspect payload):");
  process.exit(1);
}

// Decode without verification first (to see the payload even if secret is wrong)
const decoded = jwt.decode(token);
console.log("\n=== JWT Payload (decoded, no verification) ===");
console.log(JSON.stringify(decoded, null, 2));

// Try to verify with the secret
try {
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  console.log("\n=== JWT is VALID ✅ ===");
  console.log("role:", verified.role);
  console.log("sub (user_id):", verified.sub);
  const exp = new Date(verified.exp * 1000);
  console.log("expires:", exp.toISOString(), exp > new Date() ? "(not expired ✅)" : "(EXPIRED ❌)");
} catch (err) {
  console.log("\n=== JWT verification FAILED ❌ ===", err.message);
}
