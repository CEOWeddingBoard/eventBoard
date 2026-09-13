import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

function listMigrations(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => {
      if (name === "migration_lock.toml" || name.startsWith(".")) return false;
      return fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory();
    })
    .sort();
}

describe("prisma migrations", () => {
  it("keeps migrations ordered by timestamp prefix", () => {
    const names = listMigrations();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/^\d{14}_/);
    }
    expect([...names].sort()).toEqual(names);
  });

  it("creates every table idempotently so a db-push baseline can be re-deployed", () => {
    const offenders: string[] = [];

    for (const name of listMigrations()) {
      const sql = fs.readFileSync(
        path.join(MIGRATIONS_DIR, name, "migration.sql"),
        "utf8",
      );
      if (/CREATE TABLE\s+"/i.test(sql)) {
        offenders.push(`${name}: CREATE TABLE without IF NOT EXISTS`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("ships an idempotent safety-net schema script", () => {
    const ensureSql = path.join(process.cwd(), "scripts", "ensure-schema.sql");
    expect(fs.existsSync(ensureSql)).toBe(true);

    const sql = fs.readFileSync(ensureSql, "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "workflow_nodes"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "event_process_states"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "event_agenda_data"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "event_widgets"/);
    expect(/CREATE TABLE\s+"/i.test(sql)).toBe(false);
  });
});
