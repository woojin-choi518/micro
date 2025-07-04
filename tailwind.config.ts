import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // ✅ <- 여기! theme 바깥입니다
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'noto-sans': ['Noto Sans KR', 'sans-serif'],
        'pretendard': ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
