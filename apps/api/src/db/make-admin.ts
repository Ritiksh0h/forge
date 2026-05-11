// Usage: npx tsx src/db/make-admin.ts user@example.com
import { db } from "./index.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx src/db/make-admin.ts <email>");
  process.exit(1);
}

async function run() {
  const [user] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✓ ${user.email} is now admin`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
