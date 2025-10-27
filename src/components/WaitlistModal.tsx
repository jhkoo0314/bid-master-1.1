/**
 * Bid Master AI - 사전 알림 신청 모달 컴포넌트
 */

"use client";

import { useState } from "react";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      alert("이름과 이메일을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    console.log("📧 [사전 알림] 신청 시작:", { name, email });

    try {
      // API 엔드포인트를 사용하여 데이터 저장
      const response = await fetch("/api/sheets/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📧 [사전 알림] 신청 결과:", result);

      setSubmitResult(result);
    } catch (error) {
      console.error("❌ [사전 알림] 신청 오류:", error);
      setSubmitResult({
        success: false,
        message: "신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setName("");
    setEmail("");
    setSubmitResult(null);
    onClose();
  };

  // ESC 키로 모달 닫기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onKeyDown={handleKeyDown}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">사전 알림 신청</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {!submitResult ? (
            // 신청 폼
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>• 정식 출시 시 이메일로 알려드립니다</p>
                <p>• 개인정보는 서비스 알림 목적으로만 사용됩니다</p>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      신청 중...
                    </>
                  ) : (
                    "신청하기"
                  )}
                </button>
              </div>
            </form>
          ) : (
            // 신청 결과
            <div className="text-center space-y-4">
              <div
                className={`text-4xl ${
                  submitResult.success ? "text-green-500" : "text-red-500"
                }`}
              >
                {submitResult.success ? "✅" : "❌"}
              </div>

              <div>
                <h3
                  className={`text-lg font-semibold ${
                    submitResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {submitResult.success ? "신청 완료!" : "신청 실패"}
                </h3>
                <p className="text-gray-600 mt-2">{submitResult.message}</p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
