/**
 * 이용약관 페이지
 */

"use client";

import Link from "next/link";

export default function TermsOfServicePage() {
  console.log("📄 [이용약관] 페이지 접근");

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
            <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          </div>
          <p className="text-gray-600">
            Bid Master Lab 서비스 이용약관에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제1조 (목적)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                이 약관은 Bid Master Lab(이하 "회사")이 제공하는 Bid Master AI
                서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리,
                의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제2조 (정의)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>"서비스"</strong>란 AI 기반 경매 시뮬레이션 플랫폼을
                  의미합니다.
                </li>
                <li>
                  <strong>"이용자"</strong>란 서비스에 접속하여 이 약관에 따라
                  서비스를 이용하는 자를 의미합니다.
                </li>
                <li>
                  <strong>"콘텐츠"</strong>란 이용자가 서비스를 이용하면서
                  생성한 모든 정보를 의미합니다.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
                공지함으로써 효력을 발생합니다.
              </p>
              <p>
                회사는 합리적인 사유가 발생할 경우에는 이 약관을 변경할 수
                있으며, 약관이 변경되는 경우 회사는 변경된 약관의 내용과
                시행일을 정하여, 시행일로부터 최소 7일 이전에 공지합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제4조 (서비스의 제공)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI 기반 교육용 매물 생성</li>
                <li>권리분석 엔진을 통한 매물 분석</li>
                <li>수익 계산기</li>
                <li>경매 시뮬레이션</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제5조 (서비스 이용)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만,
                회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의
                두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로
                중단할 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제6조 (이용자의 의무)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>신청 또는 변경시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>
                  회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신
                  또는 게시
                </li>
                <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>
                  회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
                </li>
                <li>
                  외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는
                  정보를 서비스에 공개 또는 게시하는 행위
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제7조 (서비스의 변경 및 중단)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                회사는 운영정책상 또는 기술상의 필요에 의하여 서비스를 변경할 수
                있으며, 변경된 서비스는 그 내용을 서비스에 공지합니다.
              </p>
              <p>
                회사는 서비스의 제공을 중단할 경우에는 회사가 제공하는 서비스에
                공지하고 서비스의 제공을 중단할 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제8조 (면책조항)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </p>
              <p>
                회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는
                책임을 지지 않습니다.
              </p>
              <p>
                회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에
                대하여 책임을 지지 않으며 그 밖에 서비스를 통하여 얻은 자료로
                인한 손해에 관하여는 책임을 지지 않습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제9조 (준거법 및 관할법원)
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                이 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국의
                법을 적용하며, 본 분쟁으로 인한 소송은 민사소송법상의 관할법원에
                제기합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">부칙</h2>
            <div className="space-y-3 text-gray-700">
              <p>이 약관은 2026년 1월 1일부터 시행합니다.</p>
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
