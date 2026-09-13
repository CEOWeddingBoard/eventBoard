/**
 * Czyści bazę SQLite (usuwa plik dev.db) i ponownie tworzy schemat + seed.
 * Uruchom z katalogu projektu: npm run db:reset:fresh
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const candidates = [
  path.join(root, 'dev.db'),
  path.join(root, 'prisma', 'dev.db'),
];

let deleted = false;
for (const file of candidates) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log('Usunięto:', file);
      deleted = true;
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.error('Baza jest używana (np. przez npm run dev). Zatrzymaj serwer (Ctrl+C), potem uruchom ponownie: npm run db:reset:fresh');
        process.exit(1);
      }
      throw err;
    }
  }
}
if (!deleted) {
  console.log('Brak pliku dev.db – stosowanie schematu od zera.');
}

console.log('Stosowanie schematu (prisma db push)...');
execSync('npx prisma db push', { cwd: root, stdio: 'inherit' });
console.log('Seed (prisma db seed)...');
execSync('npx prisma db seed', { cwd: root, stdio: 'inherit' });
console.log('Baza zresetowana i wypełniona seedem.');
