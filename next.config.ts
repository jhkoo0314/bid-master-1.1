import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

// env.example 파일을 로드하여 환경 변수 설정
const envExamplePath = path.resolve(process.cwd(), "env.example");
if (fs.existsSync(envExamplePath)) {
  config({ path: envExamplePath });
  console.log("✅ [환경변수] env.example 파일에서 환경 변수 로드 완료");
} else {
  console.log("⚠️ [환경변수] env.example 파일을 찾을 수 없습니다");
}

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
