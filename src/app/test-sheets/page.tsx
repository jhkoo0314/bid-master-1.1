/**
 * 구글 시트 연결 테스트 페이지
 */

"use client";

import { useState } from "react";

export default function TestSheetsPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult("테스트 중...");

    try {
      const response = await fetch("/api/test-sheets", {
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            구글 시트 연결 테스트
          </h1>

          <div className="space-y-4">
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "테스트 중..." : "구글 시트 연결 테스트"}
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

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              확인사항:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • 구글 시트 ID: 1ZBZ9JVSo6aBWU1VSk0p7LBSCzR8eQTN05jEL4LSyhso
              </li>
              <li>
                • 서비스 계정:
                bid-master-db@bid-master-v1.iam.gserviceaccount.com
              </li>
              <li>
                • 서비스 계정이 구글 시트에 "편집자" 권한으로 공유되어 있는지
                확인
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
