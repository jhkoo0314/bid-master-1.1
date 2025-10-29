"use client";

import React, { useState } from "react";
import type { LearnSummary } from "@/types/property";
import { useSimulationStore } from "@/store/simulation-store";

interface LearnBlockProps {
  title: string;
  summary: LearnSummary;
  onOpen?: () => void;
}

export default function LearnBlock({ title, summary, onOpen }: LearnBlockProps) {
  const { devMode } = useSimulationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const stateLabel = summary.state === "preview" ? "미리보기" : summary.state === "locked" ? "분석완료" : "준비중";
  const stateColor = summary.state === "locked" ? "bg-green-100 text-green-700 border-green-200" : "text-[#5B6475] border-black/10";

  // 개발자 모드에서 표시할 상세 리포트 내용 생성
  const generateDetailedReport = () => {
    if (title === "권리분석 리포트") {
      return {
        title: "권리분석 상세 리포트",
        sections: [
          {
            title: "1. 말소기준권리 분석",
            content: [
              "• 1순위 근저당권(국민은행): 2016년 11월 22일 등기",
              "• 배당요구종기일: 2025년 4월 20일",
              "• 말소기준권리: 1순위 근저당권 (8억원)",
              "• 판단: 배당요구종기일 이전 등기로 인수 필요"
            ]
          },
          {
            title: "2. 권리 인수/소멸 분석",
            content: [
              "• 인수 권리: 1순위 근저당권 8억원 (국민은행)",
              "• 소멸 권리: 2순위 근저당권 3억원 (신한은행)",
              "• 소멸 권리: 가압류 5천만원 (김철수)",
              "• 총 인수비용: 8억원"
            ]
          },
          {
            title: "3. 임차인 대항력 분석",
            content: [
              "• 임차인: 이영희 (확정일자 보유)",
              "• 임차보증금: 5천만원",
              "• 대항력: 있음 (소액임차인 우선변제)",
              "• 인수 필요: 5천만원"
            ]
          },
          {
            title: "4. 안전 마진 계산",
            content: [
              "• 근저당권 인수비용: 8억원",
              "• 임차보증금 인수비용: 5천만원",
              "• 총 인수비용: 8억 5천만원",
              "• 실제 취득비용: 최저가 + 8억 5천만원"
            ]
          }
        ]
      };
    } else if (title === "경매분석 리포트") {
      return {
        title: "경매분석 상세 리포트",
        sections: [
          {
            title: "1. 가격 분석",
            content: [
              "• 감정가: 12억원",
              "• 최저가: 10억 5천만원 (12.4% 할인)",
              "• 주변 유사매물 대비: 적정 수준",
              "• 가격 경쟁력: 우수"
            ]
          },
          {
            title: "2. 입지 분석",
            content: [
              "• 위치: 서울시 강남구 테헤란로 123",
              "• 접근성: 지하철 2호선 강남역 도보 5분",
              "• 상업지역: 제1종 일반주거지역",
              "• 개발 전망: 양호"
            ]
          },
          {
            title: "3. 매물 특성",
            content: [
              "• 건물 유형: 아파트",
              "• 전용면적: 25.5평 (84.2㎡)",
              "• 건축년도: 2010년 (14년 경과)",
              "• 투자/거주 적합성: 모두 적합"
            ]
          },
          {
            title: "4. 낙찰가 예상",
            content: [
              "• 예상 낙찰가: 11억~12억원",
              "• 감정가 대비: 92~100%",
              "• 경쟁률 예상: 중간 수준",
              "• 낙찰 확률: 보통"
            ]
          }
        ]
      };
    }
    return null;
  };

  const detailedReport = generateDetailedReport();

  const handleToggleExpanded = () => {
    if (devMode.isDevMode) {
      setIsExpanded(!isExpanded);
      console.log(`🔧 [개발자 모드] ${title} 상세 리포트 ${isExpanded ? '닫기' : '열기'}`);
    } else {
      console.log(`📄 [사용자 액션] 학습 블록 열기: ${title}`);
      onOpen && onOpen();
    }
  };

  return (
    <div className="rounded-2xl shadow-sm border border-black/5 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0B1220]">{title}</h3>
        <span className={`text-xs rounded-full border px-2 py-0.5 ${stateColor}`}>{stateLabel}</span>
      </div>
      <div className="mt-3 space-y-1">
        {summary.bullets.slice(0, 5).map((b, idx) => (
          <div key={idx} className="text-sm text-[#5B6475]">• {b}</div>
        ))}
      </div>
      
      {/* 개발자 모드에서 상세 리포트 표시 */}
      {devMode.isDevMode && isExpanded && detailedReport && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">{detailedReport.title}</h4>
          <div className="space-y-4">
            {detailedReport.sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h5 className="text-xs font-medium text-gray-700 mb-2">{section.title}</h5>
                <div className="space-y-1">
                  {section.content.map((item, itemIdx) => (
                    <div key={itemIdx} className="text-xs text-gray-600">{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3">
        <button
          type="button"
          onClick={handleToggleExpanded}
          className={`text-xs rounded-full border px-3 py-1 hover:bg-gray-50 ${
            devMode.isDevMode && isExpanded ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-black/10'
          }`}
        >
          {devMode.isDevMode 
            ? (isExpanded ? "상세 리포트 닫기" : "상세 리포트 보기") 
            : (summary.state === "locked" ? "상세 분석 보기" : "전체보기 (정식서비스)")
          }
        </button>
      </div>
    </div>
  );
}
