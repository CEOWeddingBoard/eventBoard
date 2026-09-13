# npm audit – stan i zalecenia

## Luka Next.js (GHSA-5f7q-jpqc-wp7h / CVE-2025-59472)

**Status: ten projekt nie jest narażony.**

Luka dotyczy **Partial Prerendering (PPR) w trybie minimal**:
- Wymagane: `experimental.ppr: true` **lub** `cacheComponents: true` w `next.config.js`
- **oraz** zmienna środowiskowa `NEXT_PRIVATE_MINIMAL_MODE=1`

W tym projekcie **nie używamy PPR** ani `NEXT_PRIVATE_MINIMAL_MODE`, więc luka nie ma zastosowania.

## Zalecenia

1. **Nie uruchamiaj `npm audit fix --force`** w celu „naprawy” Next.js – zaciągnie to Next 16 (breaking change) i może zepsuć build.
2. **Eslint / eslint-config-next**: Po `npm audit fix --force` mogły się zaktualizować do ESLint 9 i eslint-config-next 16. Jeśli `npm run build` lub `npm run lint` zacznie się wywalać, przywróć wersje w `package.json` (np. eslint ^8, eslint-config-next 14.x) i zrób `npm install`.
3. **Aktualizacja Next.js**: Gdy będziesz gotowy na upgrade, rozważ Next 15.6+ (stabilny, gdy wyjdzie) lub Next 16.x – nie jest to wymagane ze względu na bezpieczeństwo w tej konfiguracji.

## Cofnięcie zmian po `npm audit fix --force`

Jeśli po `npm audit fix --force` coś przestało działać:

```bash
git checkout package.json package-lock.json
npm install
```

Potem aktualizuj tylko te pakiety, które chcesz (bez `--force`).
