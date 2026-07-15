import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gillmet: {
          navy: "#0e3b2c",
          steel: "#2f6b4f",
          accent: "#7fc242",
          bg: "#f3f7f4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
