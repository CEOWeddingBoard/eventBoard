import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Montserrat", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        reading: ["var(--font-reading)", "Cormorant Garamond", "Georgia", "serif"],
        script: ["var(--font-script)", "Great Vibes", "cursive"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        /* Biało–złoto–oliwkowa, classy */
        ivory: "#f8f6f1",
        white: "#fefdfb",
        cream: "#f5f3ee",
        black: "#0c0a09",
        ink: {
          DEFAULT: "#2d3824",
          light: "#3d4a32",
          muted: "#4a5c3e",
        },
        olive: {
          DEFAULT: "#7d8d6e",
          dark: "#6a7a5c",
          light: "#8f9e82",
          soft: "#a8b598",
          muted: "#eef2eb",
        },
        gold: {
          DEFAULT: "#9a8554",
          soft: "#b49b3d",
          light: "#c4a84a",
          subtle: "#8f7a45",
          muted: "#f5f0e6",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "50px",
      },
      backgroundImage: {
        "wedding-gradient":
          "linear-gradient(165deg, rgba(254,253,251,0.5) 0%, rgba(248,246,241,0.5) 30%, rgba(245,243,238,0.5) 60%, rgba(250,248,244,0.5) 100%)",
        "wedding-card":
          "linear-gradient(180deg, rgba(254,253,251,0.55) 0%, rgba(248,246,241,0.55) 100%)",
        "olive-subtle":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(125,141,110,0.05) 0%, transparent 55%)",
        "wedding-shine":
          "linear-gradient(105deg, transparent 0%, rgba(154,133,84,0.03) 25%, transparent 50%, rgba(125,141,110,0.025) 75%, transparent 100%)",
        "linen-texture":
          "repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(12,10,9,0.008) 2px, rgba(12,10,9,0.008) 3px), repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(12,10,9,0.006) 2px, rgba(12,10,9,0.006) 3px)",
      },
      boxShadow: {
        wedding: "0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 16px rgba(12,10,9,0.04), 0 1px 0 rgba(125,141,110,0.06)",
        "wedding-hover": "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 24px rgba(12,10,9,0.06), 0 0 0 1px rgba(125,141,110,0.1)",
        "gold-soft": "0 2px 12px rgba(154,133,84,0.12)",
        soft: "0 2px 12px rgba(12,10,9,0.04)",
        hover: "0 4px 20px rgba(12,10,9,0.06)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
