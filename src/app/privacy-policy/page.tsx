/**
 * 개인정보 처리방침 페이지
 */

"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  console.log("📄 [개인정보 처리방침] 페이지 접근");

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
            <h1 className="text-3xl font-bold text-gray-900">
              개인정보 처리방침
            </h1>
          </div>
          <p className="text-gray-600">
            Bid Master Lab는 사용자의 개인정보 보호를 위해 최선을 다하고
            있습니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. 개인정보 수집 및 이용 목적
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Bid Master Lab는 다음과 같은 목적으로 개인정보를 수집 및
                이용합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>서비스 제공 및 운영</li>
                <li>사용자 문의 및 불만 처리</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
                <li>마케팅 및 광고에 활용</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. 수집하는 개인정보의 항목
            </h2>
            <div className="space-y-3 text-gray-700">
              <h3 className="font-medium">필수 항목:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>이메일 주소 (문의 시)</li>
                <li>이름 (문의 시)</li>
              </ul>

              <h3 className="font-medium">자동 수집 항목:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>IP 주소, 쿠키, 서비스 이용 기록</li>
                <li>브라우저 정보, 접속 시간</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                수집된 개인정보는 원칙적으로 개인정보 수집 및 이용목적이 달성된
                후에는 지체없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한
                경우에는 해당 기간 동안 보관합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. 개인정보 제3자 제공
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Bid Master Lab는 원칙적으로 사용자의 개인정보를 외부에 제공하지
                않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>사용자가 사전에 동의한 경우</li>
                <li>
                  법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                  방법에 따라 수사기관의 요구가 있는 경우
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. 개인정보 보호를 위한 기술적/관리적 대책
            </h2>
            <div className="space-y-3 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>개인정보 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보 취급 직원의 최소화 및 교육</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. 개인정보 보호책임자
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                개인정보 처리에 관한 불만처리 및 개인정보 보호 관련 문의사항이
                있으시면 아래 연락처로 문의해 주시기 바랍니다.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong>개인정보 보호책임자:</strong> Bid Master Lab
                </p>
                <p>
                  <strong>이메일:</strong> privacy@bidmaster.ai
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. 고지의 의무
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                현 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
                변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행
                7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
              <p className="text-sm text-gray-500">시행일: 2025년 1월 1일</p>
            </div>
          </section>
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
