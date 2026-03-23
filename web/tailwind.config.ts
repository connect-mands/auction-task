import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f1419",
        paper: "#f6f3ee",
        accent: "#c45c26",
        muted: "#5c6670",
      },
    },
  },
  plugins: [],
};

export default config;
