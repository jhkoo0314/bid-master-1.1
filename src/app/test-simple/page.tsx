/**
 * 간단한 테스트 페이지 - 구글 시트 없이 로컬 파일에 저장
 */

"use client";

import { useState } from "react";

export default function TestSimplePage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult("테스트 중...");

    try {
      const response = await fetch("/api/test-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "테스트 사용자",
          email: "test@example.com",
        }),
      });

      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            간단한 테스트 (로컬 파일 저장)
          </h1>

          <div className="space-y-4">
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {isLoading ? "테스트 중..." : "로컬 파일 저장 테스트"}
            </button>

            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  테스트 결과:
                </h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {testResult}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              이 테스트는:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 구글 시트 없이 로컬 파일에 저장합니다</li>
              <li>• 서버가 정상 작동하는지 확인합니다</li>
              <li>• 데이터가 waitlist-data.json 파일에 저장됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
