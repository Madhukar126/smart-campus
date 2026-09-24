import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10251d",
        forest: "#126448",
        leaf: "#25a36f",
        mist: "#edf7f2"
      },
      boxShadow: { soft: "0 20px 60px rgba(16, 37, 29, 0.10)" }
    }
  },
  plugins: []
};

export default config;

