/**
 * Gmail API 테스트 페이지
 */

"use client";

import { useState } from "react";

export default function TestGmailPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<"connection" | "email">(
    "connection"
  );

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult("Gmail API 연결 테스트 중...");

    try {
      const response = await fetch("/api/test-gmail", {
        method: "GET",
      });

      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmail = async () => {
    setIsLoading(true);
    setTestResult("Gmail 이메일 발송 테스트 중...");

    try {
      const response = await fetch("/api/test-gmail", {
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
            Gmail API 테스트
          </h1>

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={testConnection}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "테스트 중..." : "Gmail API 연결 테스트"}
              </button>

              <button
                onClick={testEmail}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? "테스트 중..." : "이메일 발송 테스트"}
              </button>
            </div>

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
              <li>• .env.local 파일에 Gmail SMTP 환경 변수 설정</li>
              <li>• GMAIL_USER=jhyun06270314@gmail.com</li>
              <li>• GMAIL_APP_PASSWORD=ikqf suxu msup sqae</li>
              <li>• Gmail 계정 2단계 인증 활성화 및 앱 비밀번호 생성</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              테스트 방법:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 1단계: "Gmail API 연결 테스트" 버튼으로 SMTP 연결 확인</li>
              <li>
                • 2단계: "이메일 발송 테스트" 버튼으로 실제 이메일 발송 테스트
              </li>
              <li>• 3단계: test@example.com으로 이메일이 발송되는지 확인</li>
              <li>• 4단계: 사전 알림 신청에서 실제 이메일 발송 테스트</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
