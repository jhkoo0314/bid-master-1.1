/**
 * Bid Master AI - 수익 계산기 컴포넌트
 */

"use client";

import { useState } from "react";
import {
  calculateProfit,
  estimateEvictionCost,
  ProfitInput,
  ProfitOutput,
} from "@/lib/profit-calculator";
import {
  formatNumber,
  parseFormattedNumber,
  getFormattedInputValue,
} from "@/lib/format-utils";

export function ProfitCalculator() {
  const [input, setInput] = useState<ProfitInput>({
    appraisalValue: 1000000000, // 10억
    minimumBidPrice: 700000000, // 7억
    expectedBidPrice: 87500000, // 8,750만원 (이미지 예시)
    bankLoanRatio: 0.7, // 70%
    bankLoanAmount: 61250000, // 6,125만원
    loanInterestRate: 4.0, // 4%
    rightsToAssume: 0, // 인수해야 할 보증금
    evictionCost: 1800310, // 명도비 (이사비 및 관리비)
    remodelingCost: 8256500, // 리모델링비
    legalFees: 587600, // 법무비
    brokerageFees: 0, // 중개 비용
    holdingPeriod: 4, // 4개월
    monthlyExpenses: 204167, // 월별 지출
    monthlyIncome: 500000, // 월별 수입
    expectedSalePrice: 113000000, // 1억 1,300만원
    otherIncome: 0, // 기타수입
  });

  const [result, setResult] = useState<ProfitOutput | null>(null);

  const handleCalculate = () => {
    const calculatedResult = calculateProfit(input);
    setResult(calculatedResult);
  };

  const handleInputChange = (field: keyof ProfitInput, value: number) => {
    console.log(
      `수익계산기 입력 변경: ${field} = ${value.toLocaleString("ko-KR")}원`
    );
    setInput({ ...input, [field]: value });
  };

  const handleEstimateEviction = (areaPyeong: number) => {
    const estimated = estimateEvictionCost(areaPyeong);
    setInput({ ...input, evictionCost: estimated });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        경매 수익 계산기
      </h2>

      {/* 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 낙찰가 섹션 */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            1. 낙찰가 (Bid Price)
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            낙찰가 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.expectedBidPrice)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("expectedBidPrice", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="낙찰가를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            은행대출 비율 (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={input.bankLoanRatio * 100}
            onChange={(e) => {
              const ratio = Number(e.target.value) / 100;
              handleInputChange("bankLoanRatio", ratio);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="70"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            은행대출 금액 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.bankLoanAmount)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("bankLoanAmount", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="은행대출 금액"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대출 이자율 (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={input.loanInterestRate}
            onChange={(e) =>
              handleInputChange("loanInterestRate", Number(e.target.value))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="4.0"
          />
        </div>

        {/* 취득비용 섹션 */}
        <div className="col-span-2 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            2. 취득비용 합계
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            인수해야 할 보증금 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.rightsToAssume)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("rightsToAssume", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="인수해야 할 보증금"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            명도비 (이사비 및 관리비) (원)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formatNumber(input.evictionCost)}
              onChange={(e) => {
                const numericValue = parseFormattedNumber(e.target.value);
                handleInputChange("evictionCost", numericValue);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="명도비를 입력하세요"
            />
            <button
              onClick={() => {
                const pyeong = prompt("면적을 평 단위로 입력하세요:");
                if (pyeong) handleEstimateEviction(Number(pyeong));
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              추정
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            리모델링비 또는 기타 수리 비용 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.remodelingCost)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("remodelingCost", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="리모델링 비용"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            법무비 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.legalFees)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("legalFees", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="법무비"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            중개 비용 및 기타 명도 대행 비용 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.brokerageFees)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("brokerageFees", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="중개 비용"
          />
        </div>

        {/* 월별 현금흐름 섹션 */}
        <div className="col-span-2 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            3. 월별 지출 및 수입
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            월별 지출 (대출이자 포함 전체지출비용) (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.monthlyExpenses)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("monthlyExpenses", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="월별 지출"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            월별 수입 예상 (보증금 제외 월세 임대수입) (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.monthlyIncome)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("monthlyIncome", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="월별 수입"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            보유 기간 (개월)
          </label>
          <input
            type="number"
            value={input.holdingPeriod}
            onChange={(e) =>
              handleInputChange("holdingPeriod", Number(e.target.value))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 매도 결과 섹션 */}
        <div className="col-span-2 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            4. 매도 결과
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            매도 금액 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.expectedSalePrice)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("expectedSalePrice", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="매도 금액"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기타수입 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.otherIncome)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("otherIncome", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="기타수입"
          />
        </div>
      </div>

      {/* 계산 버튼 */}
      <button
        onClick={handleCalculate}
        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
      >
        수익 계산하기
      </button>

      {/* 결과 표시 */}
      {result && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-bold text-gray-900">계산 결과</h3>

          {/* 1. 낙찰가 및 대출 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-3">
              1. 낙찰가 (Bid Price)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">낙찰가</span>
                <span className="font-medium">
                  {result.bidPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">은행대출</span>
                <span className="font-medium">
                  {result.bankLoanAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>

          {/* 2. 세금 */}
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-bold text-red-900 mb-3">2. 세금 (Taxes)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-red-700">취득세 (1%)</span>
                <span className="font-medium">
                  {result.acquisitionTax.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">기타 (0.15%)</span>
                <span className="font-medium">
                  {result.otherTaxes.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700 font-bold">세금 합계</span>
                <span className="font-bold">
                  {result.totalTaxes.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>

          {/* 3. 취득비용 합계 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-3">3. 취득비용 합계</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">인수해야 할 보증금</span>
                <span className="font-medium">
                  {result.totalAcquisitionCosts.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">
                  총 자기자본 (은행대출 제외)
                </span>
                <span className="font-medium">
                  {result.selfCapital.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 font-bold">
                  실제 투자금액 (총)
                </span>
                <span className="font-bold">
                  {result.actualInvestment.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>

          {/* 4. 월별 현금흐름 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-bold text-purple-900 mb-3">
              4. 월별 지출 및 수입
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">월별 지출</span>
                <span className="font-medium">
                  {result.monthlyExpenses.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">월별 수입</span>
                <span className="font-medium">
                  {result.monthlyIncome.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>

          {/* 5. 매도 결과 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 mb-3">5. 매도 결과</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">매도 금액</span>
                <span className="font-medium">
                  {result.saleAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">매도 전까지 투입 금액</span>
                <span className="font-medium">
                  {result.totalInvestmentBeforeSale.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">이자비용</span>
                <span className="font-medium">
                  {result.totalInterestCost.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">중개수수료</span>
                <span className="font-medium">
                  {result.brokerageFees.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">양도세</span>
                <span className="font-medium">
                  {result.capitalGainsTax.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">기타수입</span>
                <span className="font-medium">
                  {result.otherIncome.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-yellow-800 font-bold">
                  차익 (최종 수익)
                </span>
                <span
                  className={`font-bold text-lg ${
                    result.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {result.netProfit.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">투자수익률 (ROI)</span>
              <span className="text-2xl font-bold text-gray-900">
                {result.roi.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">연환산 수익률</span>
              <span className="text-xl font-semibold text-gray-900">
                {result.annualizedRoi.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 손익분기점 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-800">
                손익분기점 (최소 매도가)
              </span>
              <span className="text-xl font-bold text-orange-900">
                {result.breakEvenPrice.toLocaleString("ko-KR")}원
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
