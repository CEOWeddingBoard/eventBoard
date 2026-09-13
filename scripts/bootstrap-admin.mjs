// Bootstrap konta administratora platformy (role=ADMIN).
// Uruchomienie:
//   node scripts/bootstrap-admin.mjs <email> <haslo> ["Imie Nazwisko"]
// lub przez zmienne srodowiskowe: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
//
// Dziala na bazie wskazanej przez DATABASE_URL (lokalnie SQLite, na Railway Postgres).
// Na produkcji:  railway run node scripts/bootstrap-admin.mjs <email> <haslo>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// Lokalnie wczytaj .env.local / .env (na Railway zmienne sa juz w srodowisku).
try {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  config();
} catch {}

const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.argv[3] || process.env.ADMIN_PASSWORD || "";
const name = process.argv[4] || process.env.ADMIN_NAME || null;

if (!email || !password) {
  console.error("Uzycie: node scripts/bootstrap-admin.mjs <email> <haslo> [\"Imie Nazwisko\"]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Haslo musi miec min. 8 znakow.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true, password: hash, ...(name ? { name } : {}) },
    create: { email, password: hash, role: "ADMIN", isActive: true, name },
    select: { id: true, email: true, role: true },
  });
  console.log("OK — konto administratora gotowe:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
