import type { Config } from "tailwindcss";

const config: Config = {
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
        primary: "#0F172A", // 다크 네이비
        secondary: "#3B82F6", // 블루 포인트 (한 단계 연하게)
        accent: "#10B981", // 민트그린 (AI/테크)

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
        },

        // ✍️ 텍스트 컬러
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          inverse: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
