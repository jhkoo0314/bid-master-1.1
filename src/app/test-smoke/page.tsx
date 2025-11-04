"use client";

/**
 * Bid Master AI - Auction Engine v0.2 스모크 테스트 페이지
 * 
 * Phase 9: 스모크 테스트 실행 페이지
 */

import { useState } from "react";
import { runSmokeTests } from "@/lib/test/smoke-test";

export default function SmokeTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      // 콘솔에 출력하기 위해 브라우저 콘솔을 활용
      console.log("🧪 스모크 테스트 시작...");
      
      const result = runSmokeTests();
      
      setResults(result);
      console.log("✅ 테스트 완료:", result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("❌ 테스트 실패:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">🧪 Auction Engine v0.2 스모크 테스트</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              이 페이지는 Phase 9 스모크 테스트를 실행합니다. 테스트는 브라우저 콘솔에 결과를 출력합니다.
              개발자 도구(F12)를 열어서 콘솔 탭을 확인하세요.
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? "테스트 실행 중..." : "테스트 실행"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 mb-2">❌ 오류 발생</h2>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {results && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">✅ 테스트 완료</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>성공: {results.success ? "✓" : "✗"}</p>
                {results.duration && <p>실행 시간: {results.duration}초</p>}
                <p className="mt-4">
                  <strong>주의:</strong> 상세한 테스트 결과는 브라우저 콘솔을 확인하세요.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">테스트 케이스 목록</h2>
            <ul className="space-y-2 text-sm">
              <li>✅ 테스트 케이스 1: 기본 샘플 (근린주택 + 다양한 권리)</li>
              <li>✅ 테스트 케이스 2: 다양한 매물유형 테스트 (아파트, 오피스텔, 단독주택, 근린주택)</li>
              <li>✅ 테스트 케이스 3: 다양한 권리유형 테스트 (근저당권, 담보가등기, 압류, 가등기, 유치권, 법정지상권, 분묘기지권)</li>
              <li>✅ 테스트 케이스 4: 위험 배지 생성 확인 (상가임차, 임차다수, 소유권분쟁, 복합 위험)</li>
              <li>✅ 테스트 케이스 5: 0원 방지 레이어 동작 확인</li>
              <li>✅ 테스트 케이스 6: devMode 로그 확인</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">⚠️ 중요 사항</h2>
            <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
              <li>테스트 실행 시 브라우저 콘솔(개발자 도구)을 열어두세요.</li>
              <li>devMode 로그는 콘솔에 출력됩니다.</li>
              <li>테스트는 서버 사이드에서 실행되므로, 브라우저 콘솔에서 일부 로그가 보이지 않을 수 있습니다.</li>
              <li>더 상세한 로그를 보려면 Node.js 환경에서 직접 실행하세요: <code className="bg-gray-100 px-2 py-1 rounded">tsx src/lib/test/smoke-test.ts</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

