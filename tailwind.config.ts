import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cosmic: {
          950: "#060913",
          900: "#0a0f1e",
          850: "#0f1629",
          800: "#151f38",
          750: "#1b2848",
          700: "#24345d",
          600: "#334980",
        },
        neon: {
          blue: "#38bdf8",
          cyan: "#06b6d4",
          purple: "#a855f7",
          indigo: "#6366f1",
          gold: "#f59e0b",
          yellow: "#facc15",
          flame: "#f97316",
          emerald: "#10b981",
        },
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      boxShadow: {
        'neon-blue': '0 0 20px -5px rgba(56, 189, 248, 0.4)',
        'neon-purple': '0 0 25px -5px rgba(168, 85, 247, 0.45)',
        'neon-gold': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'neon-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.4))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 25px rgba(99,102,241,0.8))' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
