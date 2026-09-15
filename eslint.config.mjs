import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next-dev/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "test-app/**",
  ]),
  {
    // Skrypty narzędziowe i pliki konfiguracyjne to CommonJS uruchamiany
    // bezpośrednio przez Node — `require` jest tam poprawną formą, nie zaszłością.
    files: [
      "scripts/**",
      // Generator broszury w docs/ to skrypt Node uruchamiany ręcznie,
      // nie część aplikacji — obowiązują go te same zasady co scripts/.
      "docs/**",
      "*.config.{js,cjs,mjs,ts}",
      "jest.setup.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
