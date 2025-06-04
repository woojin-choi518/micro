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
        sans: ['Noto Sans KR', 'ui-sans-serif', 'system-ui'], // 기본 폰트에 추가
        noto: ['Noto Sans KR', 'sans-serif'], // 커스텀 폰트 이름도 가능
      },
    },
  },
  plugins: [],
};

export default config;
