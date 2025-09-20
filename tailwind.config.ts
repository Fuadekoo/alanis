import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      themes: {
        light: {
          extend: "light",
          colors: {
            background: "#FFFFFF",
            foreground: "#000000",
            primary: {
              foreground: "#DEFCFA",
              DEFAULT: "#0DA194",
              50: "#DEFCFA",
              100: "#C2FAF5",
              200: "#84F5EC",
              300: "#42F0E1",
              400: "#12DECD",
              500: "#0DA194",
              600: "#0A7F76",
              700: "#085E57",
              800: "#05423D",
              900: "#03211F",
            },
            secondary: {
              foreground: "#FEF3E7",
              DEFAULT: "#F29421",
              50: "#FEF3E7",
              100: "#FCEAD4",
              200: "#FAD5A8",
              300: "#F7BE78",
              400: "#F5A94D",
              500: "#F29421",
              600: "#CF770C",
              700: "#9A5909",
              800: "#6A3D06",
              900: "#351F03",
            },
          },
        },
        dark: {
          extend: "dark",
          colors: {
            background: "#000000",
            foreground: "#FFFFFF",
            primary: {
              foreground: "#010E0D",
              DEFAULT: "#0DA194",
              50: "#010E0D",
              100: "#03211F",
              200: "#05423D",
              300: "#085E57",
              400: "#0A7F76",
              500: "#0DA194",
              600: "#12DECD",
              700: "#42F0E1",
              800: "#84F5EC",
              900: "#C2FAF5",
            },
            secondary: {
              foreground: "#180E01",
              DEFAULT: "#F29421",
              50: "#180E01",
              100: "#351F03",
              200: "#6A3D06",
              300: "#9A5909",
              400: "#CF770C",
              500: "#F29421",
              600: "#F5A94D",
              700: "#F7BE78",
              800: "#FAD5A8",
              900: "#FCEAD4",
            },
          },
        },
      },
    }),
  ],
} satisfies Config;
