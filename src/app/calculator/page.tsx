/**
 * Bid Master AI - 수익계산기 페이지
 */

"use client";

import { ProfitCalculator } from "@/components/ProfitCalculator";
import Link from "next/link";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-3 max-w-6xl py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              ← 메인으로 돌아가기
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">수익계산기</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* 수익계산기 섹션 */}
      <section className="py-16">
        <div className="container mx-auto px-3 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                경매 수익 계산기
              </h2>
              <p className="text-gray-600">입찰가와 예상 수익을 계산해보세요</p>
            </div>

            <ProfitCalculator />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-3 max-w-6xl text-center">
          <p className="text-gray-400">
            © 2025 Bid Master AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            본 서비스는 교육 목적으로 제공되며, 실제 법원 경매와 다를 수
            있습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
