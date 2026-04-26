import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        surface: "#090909",
        panel: "#101010",
        frame: "#171717",
        froth: "#f3f7f2",
        neon: "#22ff88",
        moss: "#18b965",
        sand: "#d4ff79",
        ember: "#ff7a7a",
        haze: "#95a393",
      },
      boxShadow: {
        card: "0 24px 80px rgba(0, 0, 0, 0.45)",
        glow: "0 0 0 1px rgba(34, 255, 136, 0.16), 0 18px 48px rgba(34, 255, 136, 0.14)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        hydrasleuth: {
          primary: "#22ff88",
          secondary: "#101010",
          accent: "#d4ff79",
          neutral: "#0b0b0b",
          "base-100": "#050505",
          "base-200": "#090909",
          "base-300": "#101010",
          "base-content": "#f3f7f2",
          info: "#8afbc1",
          success: "#22ff88",
          warning: "#d4ff79",
          error: "#ff7a7a",
          "--rounded-box": "1.2rem",
          "--rounded-btn": "0.95rem",
          "--rounded-badge": "9999px",
          "--tab-radius": "0.9rem",
          "--animation-btn": "0.2s",
          "--btn-text-case": "none",
        },
      },
    ],
  },
};

export default config;
