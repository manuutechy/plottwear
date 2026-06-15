import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          black: "#0D0D0D",
          white: "#FFFFFF",
          pink: "#E8A0B4",
          pinkAccent: "#D63F6F",
          gold: "#C9A84C",
          goldBg: "#F5F0E8",
          diamondBg: "#EFEFEF",
          grayDark: "#1A1A1A",
          grayMed: "#9E9E9E",
          grayLight: "#F5F5F5",
        }
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        dmsans: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
