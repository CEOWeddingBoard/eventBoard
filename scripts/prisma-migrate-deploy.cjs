/**
 * Railway / production start helper.
 *
 * Zasada nadrzędna: TEN SKRYPT NIGDY NIE BLOKUJE STARTU APLIKACJI.
 * Start command to `node scripts/prisma-migrate-deploy.cjs && npm start` — każdy
 * exit != 0 sprawiał, że `npm start` się nie uruchamiał i Railway zostawiał
 * działający STARY kontener (deploy "przechodził", ale kod się nie zmieniał).
 *
 * Kolejność synchronizacji schematu (każdy krok best-effort):
 *   1. migrate deploy         — formalna historia migracji
 *   2. rollback nieudanych    — odblokowanie P3009
 *   3. db push                — realna synchronizacja ze schema.prisma
 *   4. ensure-schema.sql      — idempotentna sieć bezpieczeństwa (CREATE IF NOT EXISTS)
 *
 * P3005: baza powstała przez `db push` (tabele są, brak historii migracji).
 * P3009: migracja padła w połowie (np. CREATE TABLE na istniejącej tabeli).
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "..", "prisma", "migrations");
const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");
const ENSURE_SQL = path.join(__dirname, "ensure-schema.sql");

const log = (msg) => console.log(`[schema-sync] ${msg}`);
const warn = (msg) => console.warn(`[schema-sync] ⚠ ${msg}`);

function listMigrationNames() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => {
      if (name === "migration_lock.toml" || name.startsWith(".")) return false;
      return fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory();
    })
    .sort();
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
    shell: process.platform === "win32",
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

const migrateDeploy = () => run("npx", ["prisma", "migrate", "deploy"]);

function dbPush({ acceptDataLoss = false } = {}) {
  const args = ["prisma", "db", "push", "--skip-generate"];
  if (acceptDataLoss) args.push("--accept-data-loss");
  return run("npx", args);
}

function parseFailedMigrationNames(output) {
  const names = new Set();
  const re = /The `([^`]+)` migration/g;
  let m;
  while ((m = re.exec(output)) !== null) names.add(m[1]);
  return [...names];
}

function rollbackFailedMigrations(output) {
  const names = parseFailedMigrationNames(output);
  if (names.length === 0) return false;
  log(`P3009: oznaczam ${names.length} nieudanych migracji jako wycofane…`);
  for (const name of names) {
    const r = run("npx", ["prisma", "migrate", "resolve", "--rolled-back", name]);
    if (!r.ok) warn(`resolve --rolled-back ${name}: ${r.output.trim()}`);
  }
  return true;
}

function baselineExistingDatabase() {
  const names = listMigrationNames();
  if (names.length === 0) return false;
  log(`Baseline: oznaczam ${names.length} migracji jako zastosowane…`);
  for (const name of names) {
    const r = run("npx", ["prisma", "migrate", "resolve", "--applied", name]);
    if (!r.ok) warn(`resolve --applied ${name}: ${r.output.trim()}`);
  }
  return true;
}

/**
 * Idempotentna sieć bezpieczeństwa. Uruchamiana ZAWSZE, nawet gdy wszystkie
 * wcześniejsze kroki się powiodły — koszt jest znikomy, a gwarantuje, że
 * krytyczne tabele istnieją niezależnie od stanu historii migracji.
 */
function ensureSchema() {
  if (!fs.existsSync(ENSURE_SQL)) {
    warn("Brak ensure-schema.sql — pomijam sieć bezpieczeństwa.");
    return false;
  }
  log("Uruchamiam ensure-schema.sql (idempotentna sieć bezpieczeństwa)…");
  const r = run("npx", [
    "prisma",
    "db",
    "execute",
    "--file",
    ENSURE_SQL,
    "--schema",
    SCHEMA_PATH,
  ]);
  if (!r.ok) {
    warn(`ensure-schema.sql nie przeszło w całości: ${r.output.trim()}`);
    return false;
  }
  log("✓ Sieć bezpieczeństwa zastosowana.");
  return true;
}

function syncMigrations() {
  log("prisma migrate deploy…");
  const first = migrateDeploy();
  if (first.ok) {
    log("✓ Migracje aktualne.");
    return;
  }

  warn("migrate deploy nie powiodło się — próbuję odzyskać.");

  if (first.output.includes("P3009")) {
    rollbackFailedMigrations(first.output);
    if (migrateDeploy().ok) {
      log("✓ Migracje aktualne po wycofaniu nieudanych.");
      return;
    }
  }

  if (first.output.includes("P3005") || first.output.includes("database schema is not empty")) {
    baselineExistingDatabase();
    if (migrateDeploy().ok) {
      log("✓ Migracje aktualne po baseline.");
      return;
    }
  }

  warn("Historia migracji niespójna — polegam na db push + ensure-schema.sql.");
}

function syncSchema() {
  log("prisma db push…");
  let pushed = dbPush();
  if (pushed.ok) {
    log("✓ Schemat zsynchronizowany.");
    return;
  }

  if (/data loss|--accept-data-loss/i.test(pushed.output)) {
    warn("db push wymaga --accept-data-loss — ponawiam.");
    pushed = dbPush({ acceptDataLoss: true });
    if (pushed.ok) {
      log("✓ Schemat zsynchronizowany (--accept-data-loss).");
      return;
    }
  }

  warn(`db push nie powiodło się: ${pushed.output.trim()}`);
}

function main() {
  try {
    syncMigrations();
    syncSchema();
    ensureSchema();
  } catch (err) {
    warn(`Nieoczekiwany błąd synchronizacji schematu: ${err?.message ?? err}`);
  }

  // ZAWSZE exit 0 — aplikacja musi wystartować nawet przy niespójnym schemacie,
  // inaczej Railway zostawia działający stary kontener i deploy jest bezużyteczny.
  log("Gotowe — uruchamiam aplikację.");
  process.exit(0);
}

main();
