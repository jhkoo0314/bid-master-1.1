/**
 * Bid Master - 실전 가이드 페이지
 * 사용자를 위한 종합 가이드
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    console.log("📖 [가이드] 페이지 접근");

    // 스크롤 위치에 따라 activeSection 업데이트
    const handleScroll = () => {
      const sections = [
        "overview",
        "getting-started",
        "how-to-play",
        "points-system",
        "level-system",
        "dashboard",
        "difficulty",
        "strategy",
        "faq",
      ];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 초기 실행

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    console.log(`📖 [가이드] 섹션 이동: ${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // 헤더 높이
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/bmlogo.png"
                alt="Bid Master Logo"
                className="h-8 w-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bid Master</h1>
                <p className="text-xs text-gray-500">실전 가이드</p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bid Master 실전 가이드
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            경매 시뮬레이션을 통한 부동산 경매 학습 플랫폼
          </p>
          <p className="text-sm text-gray-500">최종 업데이트: 2025-01-29</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 - 목차 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">목차</h2>
              <nav className="space-y-2">
                {[
                  { id: "overview", label: "개요" },
                  {
                    id: "getting-started",
                    label: "시작하기",
                  },
                  { id: "how-to-play", label: "실전 절차" },
                  { id: "points-system", label: "포인트 시스템" },
                  { id: "level-system", label: "레벨 시스템" },
                  { id: "dashboard", label: "대시보드" },
                  { id: "difficulty", label: "난이도별 특징" },
                  { id: "strategy", label: "입찰 전략" },
                  { id: "faq", label: "자주 묻는 질문" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3 space-y-8">
            {/* 1. 개요 */}
            <section
              id="overview"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">개요</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Bid Master란?
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Bid Master는 AI 기반 경매 시뮬레이션 환경에서 부동산 경매를
                    체험하고 학습할 수 있는 교육용 플랫폼입니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    사용 목적
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "실전 경험",
                        desc: "실제 경매와 유사한 상황에서 연습",
                      },
                      {
                        title: "체계적 학습",
                        desc: "권리분석부터 입찰까지 전 과정 단계별 학습",
                      },
                      {
                        title: "리스크 없음",
                        desc: "실제 돈 없이 무한 반복 연습",
                      },
                      {
                        title: "실력 향상",
                        desc: "포인트와 레벨로 실력 측정",
                      },
                      {
                        title: "전문가 도전",
                        desc: "난이도별 매물로 초보자부터 전문가까지 성장",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    학습 목표
                  </h3>
                  <p className="text-gray-700 mb-3">
                    이 플랫폼을 통해 배울 수 있는 것들:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>등기부등본의 권리분석 방법</li>
                    <li>임차인 현황 파악과 대항력 판단</li>
                    <li>적정 입찰가 산정 방법</li>
                    <li>ROI(투자수익률) 계산</li>
                    <li>경매 시장의 이해</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. 시작하기 */}
            <section
              id="getting-started"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                시작하기
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    첫 실행 방법
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                      <strong>웹사이트 접속</strong>: Bid Master 웹사이트에
                      접속합니다
                    </li>
                    <li>
                      <strong>매물 목록 확인</strong>: 메인 페이지에서 다양한
                      매물 카드를 확인합니다
                    </li>
                    <li>
                      <strong>매물 선택</strong>: 관심 있는 매물 카드를
                      클릭합니다
                    </li>
                    <li>
                      <strong>상세 정보 확인</strong>: 매물의 기본 정보,
                      권리분석, 임차인 현황 등을 확인합니다
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    화면 구성 설명
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        메인 페이지
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>
                          <strong>대시보드 헤더</strong>: 상단에 당신의 레벨,
                          포인트, 정확도, 수익률이 표시됩니다
                        </li>
                        <li>
                          <strong>필터 바</strong>: 매물 유형, 지역, 가격대,
                          난이도로 필터링할 수 있습니다
                        </li>
                        <li>
                          <strong>매물 카드</strong>: 각 매물의 간략 정보가 카드
                          형태로 표시됩니다
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        매물 상세 페이지
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>
                          <strong>기본 정보</strong>: 사건번호, 위치, 감정가,
                          최저매각가격 등
                        </li>
                        <li>
                          <strong>권리분석</strong>: 등기부등본의 권리 현황
                          (근저당권, 가압류 등)
                        </li>
                        <li>
                          <strong>임차인 현황</strong>: 현재 거주하는 임차인들의
                          정보
                        </li>
                        <li>
                          <strong>권리분석 모달</strong>: 분석한 권리분석 결과와
                          권장 입찰가
                        </li>
                        <li>
                          <strong>입찰하기 버튼</strong>: 입찰을 시작할 수
                          있습니다
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. 실전 절차 */}
            <section
              id="how-to-play"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                실전 절차
              </h2>

              <div className="space-y-6">
                {[
                  {
                    step: "1단계",
                    title: "매물 분석",
                    content: (
                      <div>
                        <p className="text-gray-700 mb-3">
                          매물 카드를 클릭하면 상세 정보를 볼 수 있습니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          확인해야 할 핵심 정보:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>
                            <strong>위치</strong>: 어떤 지역의 매물인가?
                          </li>
                          <li>
                            <strong>감정가</strong>: 법원이 평가한 시세는?
                          </li>
                          <li>
                            <strong>최저매각가격</strong>: 최소 입찰가격은?
                          </li>
                          <li>
                            <strong>매물 유형</strong>: 아파트, 오피스텔, 상가
                            등
                          </li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    step: "2단계",
                    title: "권리분석",
                    content: (
                      <div>
                        <p className="text-gray-700 mb-3">
                          <strong>"권리분석" 버튼</strong>을 클릭하면 자동으로
                          분석해줍니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          권리분석 결과에서 확인할 것:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>
                            <strong>말소기준권리</strong>: 낙찰 시 소멸되는 권리
                          </li>
                          <li>
                            <strong>인수 권리</strong>: 낙찰 시 떠안아야 할 권리
                            (추가 비용 발생)
                          </li>
                          <li>
                            <strong>임차인 인수</strong>: 계속 거주하는 임차인이
                            있다면 보증금 인수 필요
                          </li>
                          <li>
                            <strong>안전 마진</strong>: 권리 인수비용 +
                            임차보증금 총액
                          </li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    step: "3단계",
                    title: "입찰",
                    content: (
                      <div>
                        <p className="text-gray-700 mb-3">
                          <strong>"입찰하기" 버튼</strong>을 클릭하면 입찰
                          모달이 열립니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          입찰 시 입력할 정보:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          <li>
                            <strong>입찰가격</strong>: 권리분석 결과를 참고하여
                            적정 금액 입력
                          </li>
                          <li>
                            <strong>입찰자 정보</strong>: 이름, 주소, 연락처 등
                            (시뮬레이션용)
                          </li>
                          <li>
                            <strong>보증금</strong>: 입찰보증금 금액 확인
                          </li>
                        </ol>
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700">
                            <strong>입찰 팁:</strong> 권장 입찰가 범위 내에서
                            입찰하는 것이 좋습니다. 최적 입찰가에 가까울수록
                            높은 포인트를 받습니다.
                          </p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    step: "4단계",
                    title: "결과 확인",
                    content: (
                      <div>
                        <p className="text-gray-700 mb-3">
                          입찰을 제출하면 결과가 즉시 표시됩니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          결과 화면에서 확인할 것:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>
                            <strong>낙찰 성공 여부</strong>: 낙찰되었는지,
                            경쟁에 밀렸는지
                          </li>
                          <li>
                            <strong>낙찰가</strong>: 실제 낙찰된 금액 (또는
                            경쟁자들의 입찰가)
                          </li>
                          <li>
                            <strong>수익률 (ROI)</strong>: 예상 투자수익률
                          </li>
                          <li>
                            <strong>획득 포인트</strong>: 이번 시뮬레이션으로
                            얻은 포인트
                          </li>
                          <li>
                            <strong>정확도</strong>: 권장 입찰가 대비 얼마나
                            정확했는지
                          </li>
                        </ul>
                      </div>
                    ),
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-blue-500 pl-6 py-4"
                  >
                    <div className="mb-3">
                      <span className="text-sm text-gray-500">{item.step}</span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    {item.content}
                  </div>
                ))}
              </div>
            </section>

            {/* 4. 포인트 시스템 */}
            <section
              id="points-system"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                포인트 시스템
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    포인트란 무엇인가?
                  </h3>
                  <p className="text-gray-700">
                    포인트는 시뮬레이션에서의 성과를 측정하는 점수입니다.
                    포인트가 높을수록 더 정확하고 현명한 입찰을 했다는
                    의미입니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    포인트 계산 방식 (v1.2 규정)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <code className="text-sm text-gray-800">
                      최종 포인트 = (원점수 합계) × 난이도 계수
                    </code>
                  </div>
                  <p className="text-gray-700 mb-3">
                    포인트는 <strong>이벤트 기반</strong>으로 계산됩니다. 각
                    활동에 따라 고정 포인트를 받고, 난이도 계수를 곱해 최종
                    포인트를 결정합니다.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        포인트 이벤트
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 라운드 참여: +2pt</li>
                        <li>• 정답 적중(±3%): +10pt</li>
                        <li>• 근접 적중(±5%): +6pt</li>
                        <li>• 상위 20% 성과: +4pt</li>
                        <li>• 리스크 노트 제출(200자 이상): +2pt</li>
                        <li>• 무응답: -3pt</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">
                        난이도 계수
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• 초급: 0.8배</li>
                        <li>• 중급: 1.0배</li>
                        <li>• 고급: 1.2배</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 포인트 이벤트 상세 */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    포인트 이벤트 상세
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        1. 라운드 참여 (+2pt)
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        시뮬레이션에 참여하고 입찰을 제출하면 기본적으로 받는
                        포인트입니다.
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>• 입찰 제출: +2pt</div>
                        <div>• 무응답: -3pt (차감)</div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        2. 정답 적중 (+10pt)
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        사용자 입찰가가 실제 낙찰가의 ±3% 범위 내에 있을 때 받는
                        포인트입니다.
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>
                          • 낙찰가 1억원, 입찰가 9,800만원~1억 200만원: +10pt
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        3. 근접 적중 (+6pt)
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        사용자 입찰가가 실제 낙찰가의 ±5% 범위 내에 있을 때 받는
                        포인트입니다 (±3% 초과).
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>
                          • 낙찰가 1억원, 입찰가 9,500만원~1억 500만원: +6pt
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        4. 상위 20% 성과 (+4pt)
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        같은 세션에서 상위 20% 성과를 거둘 때 받는 포인트입니다.
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>• 10명 참여 시 상위 2명: +4pt</div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        5. 리스크 노트 제출 (+2pt)
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        200자 이상의 리스크 분석 노트를 제출할 때 받는
                        포인트입니다.
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>• 200자 이상 노트 제출: +2pt</div>
                        <div>• 199자 이하 노트: 0pt</div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        난이도 계수
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        최종 포인트는 원점수에 난이도 계수를 곱해 계산됩니다.
                      </p>
                      <div className="text-xs text-gray-600">
                        <div>• 초급: 0.8배 (쉬운 매물)</div>
                        <div>• 중급: 1.0배 (보통 매물)</div>
                        <div>• 고급: 1.2배 (어려운 매물)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 포인트 계산 예시 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    포인트 계산 예시
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-2">
                        시나리오 1: 중급 매물, 정답 적중
                      </h5>
                      <div className="text-sm text-blue-800 space-y-1 mb-3">
                        <div>• 난이도: 중급 (계수 1.0배)</div>
                        <div>• 라운드 참여: +2pt</div>
                        <div>• 정답 적중(±3%): +10pt</div>
                        <div>• 리스크 노트 제출(250자): +2pt</div>
                        <div>• 상위 20% 성과: +4pt</div>
                      </div>
                      <div className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                        <div>원점수 = 2 + 10 + 2 + 4 = 18pt</div>
                        <div>최종 포인트 = 18 × 1.0 = 18pt</div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-900 mb-2">
                        시나리오 2: 고급 매물, 근접 적중
                      </h5>
                      <div className="text-sm text-green-800 space-y-1 mb-3">
                        <div>• 난이도: 고급 (계수 1.2배)</div>
                        <div>• 라운드 참여: +2pt</div>
                        <div>• 근접 적중(±5%): +6pt</div>
                        <div>• 리스크 노트 제출(300자): +2pt</div>
                      </div>
                      <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                        <div>원점수 = 2 + 6 + 2 = 10pt</div>
                        <div>최종 포인트 = 10 × 1.2 = 12pt</div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-900 mb-2">
                        시나리오 3: 초급 매물, 무응답
                      </h5>
                      <div className="text-sm text-red-800 space-y-1 mb-3">
                        <div>• 난이도: 초급 (계수 0.8배)</div>
                        <div>• 무응답: -3pt</div>
                      </div>
                      <div className="text-xs text-red-700 bg-red-100 rounded p-2">
                        <div>원점수 = -3pt</div>
                        <div>최종 포인트 = -3 × 0.8 = -2.4pt → 0pt</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. 레벨 시스템 */}
            <section
              id="level-system"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                레벨 시스템
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    레벨이란 무엇인가?
                  </h3>
                  <p className="text-gray-700">
                    레벨은 당신의 경매 실력 수준을 나타내는 지표입니다. 포인트를
                    획득하면 누적되고, 누적 포인트에 따라 레벨이 결정됩니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    레벨 기준 (v1.2 규정)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            레벨
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            포인트 범위
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            설명
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { level: "L1", range: "0~199pt", desc: "입문자" },
                          { level: "L2", range: "200~499pt", desc: "초보자" },
                          { level: "L3", range: "500~999pt", desc: "중급자" },
                          { level: "L4", range: "1000~1999pt", desc: "고급자" },
                          { level: "L5", range: "2000pt 이상", desc: "전문가" },
                        ].map((item) => (
                          <tr key={item.level}>
                            <td className="border border-gray-300 px-4 py-2 font-semibold">
                              {item.level}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {item.range}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {item.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. 대시보드 */}
            <section
              id="dashboard"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                대시보드
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "레벨 (Level)",
                      desc: "현재 경매 실력 수준",
                      example: "L3 → 다음 레벨까지 250pt 남음",
                    },
                    {
                      title: "포인트 (Points)",
                      desc: "누적 획득 포인트 총합",
                      example: "750pt = L3 중급자 (500~999pt 범위)",
                    },
                    {
                      title: "정확도 (Accuracy)",
                      desc: "권장 입찰가 대비 평균 정확도",
                      example: "78% = 권장 입찰가의 평균 ±22% 범위 내에서 입찰",
                    },
                    {
                      title: "수익률 (ROI)",
                      desc: "평균 투자수익률",
                      example: "12% = 평균적으로 12%의 수익을 기대할 수 있음",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
                      <p className="text-xs text-gray-500">
                        예시: {item.example}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. 난이도별 특징 */}
            <section
              id="difficulty"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                난이도별 특징
              </h2>

              <div className="space-y-6">
                {[
                  {
                    level: "초급 (Beginner)",
                    multiplier: "0.8배",
                    features: [
                      "권리 구조가 단순함 (0~2개)",
                      "임차인 없거나 간단한 경우",
                      "권리분석이 쉬움",
                      "교육용 콘텐츠 제공",
                    ],
                    target: "경매 초보자",
                  },
                  {
                    level: "중급 (Intermediate)",
                    multiplier: "1.0배",
                    features: [
                      "권리 구조가 복잡함 (3~4개)",
                      "임차인이 있거나 복잡한 경우",
                      "권리분석이 어려움",
                      "수익률 계산이 중요",
                    ],
                    target: "기본기를 익힌 학습자",
                  },
                  {
                    level: "고급 (Advanced)",
                    multiplier: "1.2배",
                    features: [
                      "매우 복잡한 권리 구조 (5개 이상)",
                      "여러 임차인, 대항력 충돌",
                      "높은 수익률과 정확도 필요",
                      "전문가 수준의 분석 능력 요구",
                    ],
                    target: "전문가 수준의 학습자",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-blue-500 pl-6 py-4"
                  >
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.level}
                      </h3>
                      <p className="text-sm text-gray-600">
                        난이도 계수: {item.multiplier}
                      </p>
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>대상:</strong> {item.target}
                    </p>
                    <p className="text-gray-700 mb-2 font-medium">특징:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {item.features.map((feature, fIdx) => (
                        <li key={fIdx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. 입찰 전략 */}
            <section
              id="strategy"
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                입찰 전략
              </h2>

              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    1. 권리분석을 먼저 확인
                  </h3>
                  <p className="text-gray-700 mb-3">
                    입찰 전 반드시 "권리분석" 버튼을 클릭합니다.
                  </p>
                  <p className="text-gray-700 mb-2">
                    권리분석 결과에서 확인할 것:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>인수해야 할 권리 총액</li>
                    <li>임차인 보증금 총액</li>
                    <li>안전 마진 (추가 비용)</li>
                    <li>권장 입찰가 범위</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    2. 권장 입찰가 범위를 이해
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            범위
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            의미
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            추천도
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">
                            최소 입찰가 이하
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            매우 위험
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            추천 안 함
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">
                            최소 ~ 최적가
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            보통
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            양호
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">
                            최적가 근처
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            매우 안전
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            추천
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">
                            최적가 ~ 최대
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            보통
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            양호
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">
                            최대 입찰가 초과
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            수익성 저하
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            추천 안 함
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      최적가 ±10% 범위 내에서 입찰하면 정확도 배수 1.5배. 최적가
                      ±20% 범위 내에서 입찰하면 정확도 배수 1.3배.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    3. ROI 계산의 중요성
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <code className="text-sm text-gray-800">
                      ROI = (예상 수익 - 총 투자금액) ÷ 총 투자금액 × 100
                    </code>
                  </div>
                  <p className="text-gray-700 mb-2">ROI 목표:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>10% 이상: 좋은 수익</li>
                    <li>5% 이상: 양호한 수익</li>
                    <li>0% 이상: 손익분기</li>
                    <li>0% 미만: 손실</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 9. 자주 묻는 질문 */}
            <section id="faq" className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                자주 묻는 질문
              </h2>

              <div className="space-y-6">
                {[
                  {
                    q: "포인트를 잃어버렸어요",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2">
                          포인트는 브라우저의 localStorage에 저장됩니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          해결 방법:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>같은 브라우저를 사용하세요</li>
                          <li>브라우저 캐시를 삭제하지 마세요</li>
                          <li>
                            개발자 모드에서 통계 초기화 버튼을 누르지 마세요
                          </li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    q: "레벨이 오르지 않아요",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2">
                          레벨은 누적 포인트에 따라 결정됩니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          레벨 기준:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
                          <li>L1: 0~199pt (입문자)</li>
                          <li>L2: 200~499pt (초보자)</li>
                          <li>L3: 500~999pt (중급자)</li>
                          <li>L4: 1000~1999pt (고급자)</li>
                          <li>L5: 2000pt 이상 (전문가)</li>
                        </ul>
                        <p className="text-gray-700 mb-2 font-medium">
                          확인 사항:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>현재 누적 포인트를 확인하세요</li>
                          <li>대시보드의 진행률 바를 확인하세요</li>
                          <li>다음 레벨까지 남은 포인트를 확인하세요</li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    q: "최적 입찰가를 모르겠어요",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2">
                          권리분석 모달에서 권장 입찰가 범위를 확인하세요.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          권리분석 사용 방법:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          <li>매물 상세 페이지에서 "권리분석" 버튼 클릭</li>
                          <li>권리분석 모달에서 "권장 입찰가 범위" 확인</li>
                          <li>최적 입찰가를 기준으로 ±10% 범위 내에서 입찰</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    q: "포인트가 너무 적게 나와요",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2">
                          포인트는 여러 요소로 계산됩니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          포인트를 높이는 방법:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>난이도가 높은 매물 선택 (중급, 고급)</li>
                          <li>권리분석을 정확히 하고 최적가에 입찰</li>
                          <li>수익률(ROI)이 높은 매물 선택</li>
                          <li>정답 적중(±3%) 또는 근접 적중(±5%)</li>
                          <li>리스크 노트 제출(200자 이상)</li>
                          <li>상위 20% 성과 달성</li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    q: "정확도가 낮아요",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2">
                          정확도는 권장 입찰가 대비 얼마나 정확했는지입니다.
                        </p>
                        <p className="text-gray-700 mb-2 font-medium">
                          정확도를 높이는 방법:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>권리분석 모달에서 권장 입찰가 범위 확인</li>
                          <li>최적 입찰가에 가깝게 입찰 (±10% 이내)</li>
                          <li>여러 번 시도하면서 경험 쌓기</li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    q: "처음 시작하는데 어떻게 해야 하나요?",
                    a: (
                      <div>
                        <p className="text-gray-700 mb-2 font-medium">
                          추천 순서:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          <li>초급 매물 선택: 처음에는 쉬운 매물부터</li>
                          <li>기본 정보 확인: 위치, 가격 등 기본 정보 파악</li>
                          <li>
                            권리분석 실행: 권리분석 모달에서 학습 내용 확인
                          </li>
                          <li>입찰 연습: 권장 입찰가 범위 내에서 입찰 연습</li>
                          <li>결과 확인: 포인트와 정확도 확인</li>
                          <li>반복 연습: 여러 매물로 반복 연습</li>
                        </ol>
                        <div className="mt-4 bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">
                            실패해도 배운다. 여러 번 시도하세요. 포인트와 레벨이
                            오르는 것을 확인하세요.
                          </p>
                        </div>
                      </div>
                    ),
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Q{idx + 1}. {item.q}
                    </h3>
                    <div className="text-gray-700">{item.a}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 마무리 */}
            <section className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                마무리
              </h2>
              <p className="text-gray-700 text-center mb-6">
                Bid Master는 경매를 배우고 실력을 키우는 플랫폼입니다.
              </p>
              <div className="bg-white rounded-lg p-6">
                <p className="text-gray-700 font-medium mb-3">핵심 포인트:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>권리분석을 먼저 확인하세요</li>
                  <li>권장 입찰가 범위를 이해하세요</li>
                  <li>ROI 계산을 중요하게 생각하세요</li>
                  <li>실패해도 포인트는 받으니 걱정 마세요</li>
                  <li>여러 번 연습하며 실력을 키우세요</li>
                </ul>
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  메인으로 돌아가기
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
