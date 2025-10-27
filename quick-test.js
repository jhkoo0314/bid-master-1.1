// 구글시트 연결 빠른 테스트
require("dotenv").config({ path: ".env.local" });
const { addWaitlistToSheet } = require("./src/lib/google-sheets.ts");

console.log("🔍 구글시트 연결 빠른 테스트...");

addWaitlistToSheet("Test", "test@example.com")
  .then((result) => {
    console.log("✅ 성공:", result);
    console.log("🎉 구글시트 MCP 정상 작동!");
  })
  .catch((error) => {
    console.error("❌ 실패:", error.message);
  });




