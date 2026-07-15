import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gillmet: {
          navy: "#0f1b2d",
          steel: "#2f3e50",
          accent: "#c8a951",
          bg: "#f4f6f8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
