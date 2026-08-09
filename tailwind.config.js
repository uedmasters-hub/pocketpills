/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Production primitives (prefer semantic tokens in components)
        brand: {
          100: "#ffffff",
          200: "#f5f4fa",
          300: "#e5e3ff",
          400: "#aaa4ff",
          500: "#8c60ff",
          600: "#7b47ff",
          700: "#6b1ce2",
          800: "#37325d",
          900: "#220f3e",
          950: "#4e2a84",
        },
        pp: {
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          950: "var(--primary-950)",
        },
        neutral: {
          0: "var(--neutral-0)",
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
        },

        // Semantic (theme-swappable)
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          pressed: "var(--color-primary-pressed)",
          subtle: "var(--color-primary-subtle)",
          fg: "var(--color-primary-fg)",
        },
        cta: {
          DEFAULT: "var(--color-cta)",
          hover: "var(--color-cta-hover)",
          pressed: "var(--color-cta-pressed)",
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
      // Production type scale (Satoshi)
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1.5", letterSpacing: "0.02em" }],   // 11  body-xxs / meta
        xs:    ["0.75rem",   { lineHeight: "1.25", letterSpacing: "0.04em" }],  // 12  caps-xxs
        sm:    ["0.875rem",  { lineHeight: "1.5", letterSpacing: "0.02em" }],   // 14  body-xs
        base:  ["1rem",      { lineHeight: "1.5", letterSpacing: "0.02em" }],   // 16  body-s
        md:    ["1.125rem",  { lineHeight: "1.5", letterSpacing: "0.02em" }],   // 18  body-m
        lg:    ["1.25rem",   { lineHeight: "1.2", letterSpacing: "0" }],        // 20  h6 / body-l
        xl:    ["1.4375rem", { lineHeight: "1.2", letterSpacing: "0.02em" }],   // 23  h5
        "2xl": ["1.625rem",  { lineHeight: "1.2", letterSpacing: "0" }],        // 26  h4
        "3xl": ["clamp(1.625rem, 2.8vw, 1.813rem)", { lineHeight: "1.2" }],     // ~26–29 h3
        "4xl": ["clamp(2rem, 3.2vw, 2.563rem)", { lineHeight: "1.2" }],         // ~32–41 h2
        "5xl": ["clamp(2.25rem, 4vw, 2.875rem)", { lineHeight: "1.15" }],       // ~36–46 h1
      },
      fontFamily: {
        display: ['"Satoshi"', "Arial", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        sans:    ['"Satoshi"', "Arial", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      // Production radius: s 8 · m 16 · l 24 · x 36 · xl 48
      borderRadius: {
        lg: "0.5rem",    // radius-s
        xl: "1rem",      // radius-m
        "2xl": "1.5rem", // radius-l
        "3xl": "2.25rem",// radius-x
      },
      boxShadow: {
        card: "0 1px 3px -1px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        float: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        ring: "0 0 0 3px var(--primary-500)",
        btn: "0 2px 4px rgba(0,0,0,0.05)",
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
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
