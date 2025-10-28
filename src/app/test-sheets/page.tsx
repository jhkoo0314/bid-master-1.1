/**
 * 구글 시트 연결 테스트 페이지
 */

"use client";

import { useState, useEffect } from "react";

// 실패기록 타입 정의
interface FailureLog {
  id: string;
  timestamp: string;
  testType: string;
  errorMessage: string;
  userAgent: string;
  ipAddress: string;
  details: any;
}

export default function TestSheetsPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 랜덤 실패기록 데이터 생성 (새로고침할 때마다 다른 데이터)
  const generateRandomFailureLogs = () => {
    console.log("🎲 [실패기록] 랜덤 실패기록 데이터 생성 시작");

    const testTypes = [
      "구글 시트 연결 테스트",
      "API 인증 테스트",
      "데이터베이스 연결 테스트",
      "이메일 발송 테스트",
      "파일 업로드 테스트",
      "사용자 인증 테스트",
      "웹소켓 연결 테스트",
      "캐시 서버 테스트",
      "로드 밸런서 테스트",
      "CDN 연결 테스트",
    ];

    const errorMessages = [
      "연결 시간 초과 (Timeout)",
      "인증 실패 (401 Unauthorized)",
      "서버 내부 오류 (500 Internal Server Error)",
      "네트워크 연결 실패",
      "권한 부족 (403 Forbidden)",
      "리소스를 찾을 수 없음 (404 Not Found)",
      "요청 형식 오류 (400 Bad Request)",
      "서비스 일시 중단 (503 Service Unavailable)",
      "메모리 부족 (Out of Memory)",
      "디스크 공간 부족 (Disk Full)",
      "데이터베이스 연결 실패",
      "SSL 인증서 만료",
      "방화벽 차단",
      "DNS 해석 실패",
    ];

    const browsers = [
      "Chrome/120.0.0.0",
      "Firefox/121.0",
      "Safari/17.2",
      "Edge/120.0.0.0",
      "Opera/106.0.0.0",
    ];

    const environments = [
      "development",
      "staging",
      "production",
      "test",
      "local",
    ];

    // 랜덤한 개수 (3-8개)의 실패기록 생성
    const logCount = Math.floor(Math.random() * 6) + 3;
    const randomLogs: FailureLog[] = [];

    for (let i = 0; i < logCount; i++) {
      const randomTestType =
        testTypes[Math.floor(Math.random() * testTypes.length)];
      const randomErrorMessage =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];
      const randomBrowser =
        browsers[Math.floor(Math.random() * browsers.length)];
      const randomEnv =
        environments[Math.floor(Math.random() * environments.length)];

      // 랜덤한 시간 (최근 7일 내)
      const randomTime = new Date();
      randomTime.setTime(
        randomTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
      );

      // 랜덤한 IP 주소 생성
      const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      const randomLog: FailureLog = {
        id: `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: randomTime.toISOString(),
        testType: randomTestType,
        errorMessage: randomErrorMessage,
        userAgent: randomBrowser,
        ipAddress: randomIP,
        details: {
          statusCode: Math.floor(Math.random() * 500) + 100,
          responseTime: Math.floor(Math.random() * 5000) + 100,
          retryCount: Math.floor(Math.random() * 5),
          environment: randomEnv,
          sessionId: Math.random().toString(36).substr(2, 12),
          requestId: Math.random().toString(36).substr(2, 8),
          userId: Math.floor(Math.random() * 1000),
          severity: ["low", "medium", "high", "critical"][
            Math.floor(Math.random() * 4)
          ],
          component: ["auth", "database", "api", "frontend", "cache", "queue"][
            Math.floor(Math.random() * 6)
          ],
        },
      };

      randomLogs.push(randomLog);
    }

    // 시간순으로 정렬 (최신순)
    randomLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setFailureLogs(randomLogs);
    setLastRefresh(new Date());
    console.log(`✅ [실패기록] ${randomLogs.length}개 랜덤 실패기록 생성 완료`);
  };

  // 실패기록 가져오기 (랜덤 데이터로 대체)
  const fetchFailureLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // 실제 API 호출 대신 랜덤 데이터 생성
      generateRandomFailureLogs();
    } catch (error) {
      console.error("❌ [실패기록] 실패기록 생성 오류:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 컴포넌트 마운트 시 랜덤 실패기록 생성
  useEffect(() => {
    console.log("🔄 [실패기록] 페이지 로드 - 랜덤 실패기록 생성");
    generateRandomFailureLogs();
  }, []);

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
      const errorMessage = `오류: ${error}`;
      setTestResult(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-3">
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

          {/* 실패기록 보관소 */}
          <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-800">
                🗂️ 실패기록 보관소
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={fetchFailureLogs}
                  disabled={isLoadingLogs}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isLoadingLogs ? "로딩..." : "새로고침"}
                </button>
                <button
                  onClick={generateRandomFailureLogs}
                  disabled={isLoadingLogs}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:bg-gray-400"
                >
                  🎲 새 랜덤 데이터 생성
                </button>
                <span className="text-xs text-red-600">
                  마지막 업데이트: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {failureLogs.length === 0 ? (
              <div className="text-center py-8 text-red-600">
                <p className="text-lg">📭 실패기록이 없습니다</p>
                <p className="text-sm mt-2">
                  테스트를 실행하여 실패기록을 생성해보세요
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {failureLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white p-4 rounded-lg border border-red-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {log.testType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        {log.id.split("_")[1]}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        오류 메시지:
                      </p>
                      <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        {log.errorMessage}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">IP:</span> {log.ipAddress}
                      </div>
                      <div>
                        <span className="font-medium">브라우저:</span>{" "}
                        {log.userAgent.split(" ")[0]}
                      </div>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          상세 정보 보기
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-xs text-red-600">
              💡 새로고침할 때마다 완전히 다른 랜덤 실패기록이 생성됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
