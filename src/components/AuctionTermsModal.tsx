/**
 * 주요경매용어 모달 컴포넌트
 */

"use client";

import { useState } from "react";

interface AuctionTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Term {
  term: string;
  definition: string;
  example?: string;
  category: string;
}

const auctionTerms: Term[] = [
  {
    term: "감정가",
    definition: "법원이 부동산의 시장가치를 평가한 금액",
    example: "감정가 3억원",
    category: "기본용어",
  },
  {
    term: "최저가",
    definition: "경매에서 최소 입찰 가능한 금액 (보통 감정가의 70~90%)",
    example: "감정가 3억원 → 최저가 2.1억원",
    category: "기본용어",
  },
  {
    term: "유찰",
    definition: "경매에서 입찰자가 없거나 최저가 미달로 매각되지 않는 것",
    example: "1회 유찰 → 2회차에서 최저가 10% 할인",
    category: "기본용어",
  },
  {
    term: "낙찰",
    definition: "경매에서 최고가로 입찰하여 매물을 낙찰받는 것",
    example: "낙찰가 2.5억원",
    category: "기본용어",
  },
  {
    term: "전세권",
    definition: "전세금을 지급하고 일정기간 부동산을 사용할 수 있는 권리",
    example: "전세권 설정으로 전세금 1억원",
    category: "권리유형",
  },
  {
    term: "지상권",
    definition: "타인의 토지 위에 건물을 소유할 수 있는 권리",
    example: "지상권 설정으로 건물 소유",
    category: "권리유형",
  },
  {
    term: "저당권",
    definition: "채무의 담보로 부동산에 설정하는 담보권",
    example: "저당권 설정으로 대출 담보",
    category: "권리유형",
  },
  {
    term: "가압류",
    definition: "채권보전을 위해 부동산 처분을 제한하는 법적 조치",
    example: "가압류 등기로 처분 제한",
    category: "법적상태",
  },
  {
    term: "가처분",
    definition: "임시로 부동산 처분을 금지하는 법적 조치",
    example: "가처분 등기로 매매 제한",
    category: "법적상태",
  },
  {
    term: "등기부등본",
    definition: "부동산의 소유권과 권리관계를 기록한 공식 문서",
    example: "등기부등본 확인으로 권리관계 파악",
    category: "서류",
  },
  {
    term: "현황조사서",
    definition: "부동산의 물리적 현황을 조사한 문서",
    example: "현황조사서로 건물 상태 확인",
    category: "서류",
  },
  {
    term: "점유자",
    definition: "실제로 부동산을 사용하고 있는 사람",
    example: "점유자 퇴거 협의 필요",
    category: "실제상황",
  },
  {
    term: "명도",
    definition: "부동산을 점유자로부터 인도받는 것",
    example: "명도소송으로 점유자 퇴거",
    category: "실제상황",
  },
  {
    term: "대지권",
    definition: "아파트 등에서 전유부분과 함께 부수되는 대지 사용권",
    example: "대지권 비율 0.1234",
    category: "권리유형",
  },
  {
    term: "관리비",
    definition: "공동주택의 관리 및 운영에 필요한 비용",
    example: "월 관리비 15만원",
    category: "비용",
  },
  {
    term: "수선비",
    definition: "공동주택의 수리 및 보수에 필요한 비용",
    example: "수선비 적립금 500만원",
    category: "비용",
  },
  {
    term: "임대차보증금",
    definition: "임대차 계약 시 임차인이 임대인에게 지급하는 보증금",
    example: "임대차보증금 3,000만원",
    category: "비용",
  },
  {
    term: "경매개시결정",
    definition: "법원이 경매 절차를 시작한다고 결정하는 것",
    example: "경매개시결정 통지서 수령",
    category: "절차",
  },
  {
    term: "입찰참가신청",
    definition: "경매 입찰에 참가하기 위해 신청하는 절차",
    example: "입찰참가신청 마감일 확인",
    category: "절차",
  },
  {
    term: "낙찰가",
    definition: "경매에서 최종적으로 낙찰된 금액",
    example: "낙찰가 2.8억원",
    category: "기본용어",
  },
  {
    term: "입찰가",
    definition: "경매에서 입찰자가 제시한 금액",
    example: "입찰가 2.5억원",
    category: "기본용어",
  },
  {
    term: "낙찰가율",
    definition: "낙찰가가 감정가 대비 차지하는 비율",
    example: "감정가 3억원, 낙찰가 2.7억원 → 낙찰가율 90%",
    category: "기본용어",
  },
  {
    term: "경쟁률",
    definition: "경매에 참여한 입찰자 수",
    example: "경쟁률 5:1 (5명이 경쟁)",
    category: "기본용어",
  },
  {
    term: "입찰보증금",
    definition: "경매 입찰 시 납부해야 하는 보증금 (최저가의 10%)",
    example: "최저가 2.1억원 → 입찰보증금 2,100만원",
    category: "기본용어",
  },
];

const categories = [
  "전체",
  "기본용어",
  "권리유형",
  "법적상태",
  "서류",
  "실제상황",
  "비용",
  "절차",
];

export function AuctionTermsModal({ isOpen, onClose }: AuctionTermsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredTerms = auctionTerms.filter((term) => {
    const matchesCategory =
      selectedCategory === "전체" || term.category === selectedCategory;
    const matchesSearch =
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleClose = () => {
    console.log("📚 [경매용어] 모달 닫기");
    setSearchTerm("");
    setSelectedCategory("전체");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📚 주요 경매 용어</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            경매 투자에 필요한 핵심 용어들을 쉽게 배워보세요
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="용어 검색..."
                value={searchTerm}
                onChange={(e) => {
                  console.log("🔍 [경매용어] 검색어 변경:", e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    console.log("📂 [경매용어] 카테고리 변경:", category);
                    setSelectedCategory(category);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 용어 목록 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTerms.map((term, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-blue-600">
                      {term.term}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      {term.category}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{term.definition}</p>
                  {term.example && (
                    <p className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-blue-500">
                      💡 예시: {term.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 {filteredTerms.length}개의 용어
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
