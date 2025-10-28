import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 🌙 다크 모드 활성화 (html에 'dark' 클래스 적용 시)
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🎨 Bid Master 컬러 토큰
      colors: {
        // 💙 브랜드 메인 팔레트
        primary: {
          DEFAULT: "#0F172A", // 다크 네이비
          dark: "#E2E8F0", // 다크 모드용 (밝은 텍스트)
        },
        secondary: {
          DEFAULT: "#2563EB", // 블루 포인트
          dark: "#3B82F6", // 다크 모드용 약간 밝은 블루
        },
        accent: {
          DEFAULT: "#10B981", // 민트그린 (AI/테크)
          dark: "#34D399", // 다크 모드용 라이트 민트
        },

        // ✅ 상태 피드백
        success: "#22C55E",
        warning: "#F97316",
        danger: "#DC2626",

        // 🧱 배경 컬러 계층
        background: {
          DEFAULT: "#FFFFFF", // 라이트 모드 기본 배경
          soft: "#F9FAFB", // 카드/밝은 영역
          alt: "#F1F5F9", // 구분 섹션
          footer: "#0F172A", // 푸터

          dark: "#0B1120", // 다크모드 기본
          softdark: "#1E293B", // 카드/대체
          altdark: "#334155", // 구분 섹션
          footerdark: "#020617", // 푸터
        },

        // ✍️ 텍스트 컬러
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          inverse: "#E2E8F0",

          darkprimary: "#E2E8F0",
          darksecondary: "#CBD5E1",
          darkmuted: "#64748B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
