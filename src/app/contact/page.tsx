/**
 * 문의하기 페이지
 */

"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  console.log("📧 [문의하기] 페이지 접근");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      console.log("📧 [문의하기] 문의 제출 시도", formData);

      // 실제로는 서버 액션이나 API 호출을 여기서 처리
      // 현재는 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      console.log("📧 [문의하기] 문의 제출 완료");
    } catch (error) {
      console.error("❌ [문의하기] 문의 제출 실패", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/bmlogo.png"
              alt="Bid Master Logo"
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-900">문의하기</h1>
          </div>
          <p className="text-gray-600">
            Bid Master Lab에 대한 문의사항이나 피드백을 보내주세요. 빠른 시일
            내에 답변드리겠습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 문의 폼 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              문의 양식
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이름 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이메일 *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  제목 *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="문의 제목을 입력해주세요"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  문의 내용 *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="문의하실 내용을 자세히 적어주세요"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "전송 중..." : "문의 보내기"}
              </button>

              {submitStatus === "success" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    문의가 성공적으로 전송되었습니다. 빠른 시일 내에
                    답변드리겠습니다.
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* 연락처 정보 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                연락처 정보
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm">📧</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">이메일</h3>
                    <p className="text-gray-600 text-sm">
                      contact@bidmaster.ai
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm">⏰</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">응답 시간</h3>
                    <p className="text-gray-600 text-sm">평일 24시간 이내</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      주요 문의 분야
                    </h3>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 서비스 이용 문의</li>
                      <li>• 기술적 문제</li>
                      <li>• 기능 개선 제안</li>
                      <li>• 파트너십 문의</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                자주 묻는 질문
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Q. 서비스는 무료인가요?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    네, Bid Master Lab는 교육용 서비스로 현재 무료로 제공됩니다.
                    추후 유료화 예정입니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Q. 실제 경매와 다른가요?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    본 서비스는 교육 목적으로 제공되며, 실제 법원 경매와 다를 수
                    있습니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Q. 데이터는 어떻게 보호되나요?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    개인정보는 암호화되어 안전하게 보호되며, 제3자에게 제공되지
                    않습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
