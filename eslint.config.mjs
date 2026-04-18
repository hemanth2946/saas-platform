import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Enforce design system token usage — no raw Tailwind text/font/color classes.
    // Exception: lib/ui/ files define the tokens and intentionally use raw strings.
    files: ["**/*.{ts,tsx}"],
    ignores: ["lib/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/\\btext-(xs|sm|base|lg|xl|2xl|3xl)\\b/]",
          message:
            "Use typography tokens from @/lib/ui — e.g. typography.body.default",
        },
        {
          selector:
            "Literal[value=/\\bfont-(normal|medium|semibold|bold)\\b/]",
          message:
            "Use typography tokens from @/lib/ui — font weight is included in tokens",
        },
        {
          selector:
            "Literal[value=/\\btext-(gray|slate|zinc|red|green|blue|purple|amber|orange|yellow)-[0-9]+\\b/]",
          message:
            "Use semantic color variables — e.g. text-text-primary or text-[var(--color-text-error)]",
        },
        {
          selector: "Literal[value=/\\bfont-(sans|mono|serif)\\b/]",
          message:
            "Use CSS variable font families via typography tokens",
        },
      ],
    },
  },
]);

export default eslintConfig;
