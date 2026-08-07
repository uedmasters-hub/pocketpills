/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Primitive palette (raw values; components should prefer semantic below) ──
        violet: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
          400: "#A78BFA", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9",
          800: "#5B21B6", 900: "#4C1D95",
        },
        emerald: {
          50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
          400: "#34D399", 500: "#10B981", 600: "#059669", 700: "#047857",
          800: "#065F46", 900: "#064E3B",
        },
        teal: {
          50: "#F0FDFA", 100: "#CCFBF1", 200: "#99F6E4", 300: "#5EEAD4",
          400: "#2DD4BF", 500: "#14B8A6", 600: "#0D9488", 700: "#0F766E",
        },
        coral: {
          50: "#FFF7ED", 100: "#FFEDD5", 200: "#FED7AA", 300: "#FDBA74",
          400: "#FB923C", 500: "#F97316", 600: "#EA580C", 700: "#C2410C",
        },
        stone: {
          50: "#FAFAF9", 100: "#F5F5F4", 200: "#E7E5E4", 300: "#D6D3D1",
          400: "#A8A29E", 500: "#78716C", 600: "#57534E", 700: "#44403C",
          800: "#292524", 900: "#1C1917",
        },

        // ── Semantic tokens (theme-swappable via CSS variables) ──
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          pressed: "var(--color-primary-pressed)",
          subtle: "var(--color-primary-subtle)",
          fg: "var(--color-primary-fg)",
        },
        wellness: { DEFAULT: "var(--color-wellness)", subtle: "var(--color-wellness-subtle)" },
        accent: { DEFAULT: "var(--color-accent)", subtle: "var(--color-accent-subtle)" },
        success: { DEFAULT: "var(--color-success)", subtle: "var(--color-success-subtle)" },
        warning: { DEFAULT: "var(--color-warning)", subtle: "var(--color-warning-subtle)" },
        danger: { DEFAULT: "var(--color-danger)", subtle: "var(--color-danger-subtle)" },
        info: { DEFAULT: "var(--color-info)", subtle: "var(--color-info-subtle)" },

        surface: {
          0: "var(--surface-0)", 1: "var(--surface-1)", 2: "var(--surface-2)",
          3: "var(--surface-3)", 4: "var(--surface-4)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },
        line: {
          DEFAULT: "var(--border-default)",
          divider: "var(--border-divider)",
          strong: "var(--border-strong)",
        },
      },
      fontFamily: {
        display: ['"Hanken Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        card: "0 1px 2px rgba(28,25,23,0.04), 0 4px 16px rgba(28,25,23,0.06)",
        float: "0 8px 30px rgba(28,25,23,0.10)",
        ring: "0 0 0 4px var(--color-primary-subtle)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
};
