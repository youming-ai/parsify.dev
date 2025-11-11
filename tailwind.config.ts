import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      screens: {
        xs: "475px",
        "3xl": "1600px",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      touchAction: {
        "pan-x": "pan-x",
        "pan-y": "pan-y",
      },
      maxHeight: {
        "screen-xs": "475px",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // RTL/LTR support utilities
      writingDirection: {
        "ltr": "ltr",
        "rtl": "rtl",
      },
    },
  },
  plugins: [
    // RTL support plugin
    plugin(({ addUtilities }) => {
      addUtilities({
        // Text direction utilities
        '.dir-rtl': {
          direction: 'rtl',
        },
        '.dir-ltr': {
          direction: 'ltr',
        },

        // Text alignment for RTL
        '.text-start': {
          'text-align': 'start',
        },
        '.text-end': {
          'text-align': 'end',
        },

        // Float utilities for RTL
        '.float-start': {
          'float': 'left',
        },
        '.rtl-float-start': {
          'float': 'right',
        },
        '.float-end': {
          'float': 'right',
        },
        '.rtl-float-end': {
          'float': 'left',
        },

        // Margin utilities for RTL
        '.ms-1': { 'margin-inline-start': '0.25rem' },
        '.me-1': { 'margin-inline-end': '0.25rem' },
        '.ms-2': { 'margin-inline-start': '0.5rem' },
        '.me-2': { 'margin-inline-end': '0.5rem' },
        '.ms-4': { 'margin-inline-start': '1rem' },
        '.me-4': { 'margin-inline-end': '1rem' },
        '.ms-6': { 'margin-inline-start': '1.5rem' },
        '.me-6': { 'margin-inline-end': '1.5rem' },
        '.ms-8': { 'margin-inline-start': '2rem' },
        '.me-8': { 'margin-inline-end': '2rem' },

        // Padding utilities for RTL
        '.ps-1': { 'padding-inline-start': '0.25rem' },
        '.pe-1': { 'padding-inline-end': '0.25rem' },
        '.ps-2': { 'padding-inline-start': '0.5rem' },
        '.pe-2': { 'padding-inline-end': '0.5rem' },
        '.ps-4': { 'padding-inline-start': '1rem' },
        '.pe-4': { 'padding-inline-end': '1rem' },
        '.ps-6': { 'padding-inline-start': '1.5rem' },
        '.pe-6': { 'padding-inline-end': '1.5rem' },
        '.ps-8': { 'padding-inline-start': '2rem' },
        '.pe-8': { 'padding-inline-end': '2rem' },

        // Border utilities for RTL
        '.border-s': { 'border-inline-start-width': '1px' },
        '.border-e': { 'border-inline-end-width': '1px' },
        '.border-s-2': { 'border-inline-start-width': '2px' },
        '.border-e-2': { 'border-inline-end-width': '2px' },
        '.border-s-4': { 'border-inline-start-width': '4px' },
        '.border-e-4': { 'border-inline-end-width': '4px' },

        // Rounded utilities for RTL
        '.rounded-s': {
          'border-start-start-radius': '0.25rem',
          'border-end-start-radius': '0.25rem',
        },
        '.rounded-e': {
          'border-start-end-radius': '0.25rem',
          'border-end-end-radius': '0.25rem',
        },
        '.rounded-s-lg': {
          'border-start-start-radius': '0.5rem',
          'border-end-start-radius': '0.5rem',
        },
        '.rounded-e-lg': {
          'border-start-end-radius': '0.5rem',
          'border-end-end-radius': '0.5rem',
        },

        // Logical positioning
        '.inset-start-0': { 'inset-inline-start': '0px' },
        '.inset-end-0': { 'inset-inline-end': '0px' },
        '.start-0': { 'inset-inline-start': '0px' },
        '.end-0': { 'inset-inline-end': '0px' },
        '.start-auto': { 'inset-inline-start': 'auto' },
        '.end-auto': { 'inset-inline-end': 'auto' },
      });
    }),
  ],
};

export default config;
