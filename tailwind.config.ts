import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { access: { 50: "#fbeff0", 100: "#f6dcdd", 200: "#eeb9bb", 300: "#e0898c", 400: "#cc5a5e", 500: "#b8444a", 600: "#a4373a", 700: "#8a2d30", 800: "#722729", 900: "#5e2426", 950: "#331112" } } } },
  plugins: [],
};
export default config;
