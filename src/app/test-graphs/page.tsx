"use client";

import { useState } from "react";
import { CircularProgressChart } from "@/components/CircularProgressChart";

export default function TestGraphsPage() {
  const [testData, setTestData] = useState({
    successRate: 80,
    competitionRate: 5,
    appraisalRate: 75,
  });

  const updateTestData = () => {
    setTestData({
      successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      competitionRate: Math.floor(Math.random() * 8) + 2, // 2-10:1
      appraisalRate: Math.floor(Math.random() * 30) + 70, // 70-100%
    });
  };

  console.log("🧪 [테스트] 그래프 미리보기 페이지 로드됨");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📊 원형 프로그레스 차트 미리보기
          </h1>

          {/* 컨트롤 패널 */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              🎛️ 테스트 데이터 조정
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  낙찰가율: {testData.successRate}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={testData.successRate}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      successRate: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경쟁률: {testData.competitionRate}:1
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={testData.competitionRate}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      competitionRate: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  감정가율: {testData.appraisalRate}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={testData.appraisalRate}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      appraisalRate: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <button
              onClick={updateTestData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🎲 랜덤 데이터 생성
            </button>
          </div>

          {/* 원형 프로그레스 차트 테스트 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🥇 원형 프로그레스 차트 테스트
            </h3>
            <div className="space-y-6">
              <CircularProgressChart
                label="낙찰가율"
                value={testData.successRate}
                maxValue={100}
                unit="%"
                color="#3B82F6"
              />
              <CircularProgressChart
                label="경쟁률"
                value={testData.competitionRate}
                maxValue={10}
                unit=":1"
                color="#10B981"
              />
              <CircularProgressChart
                label="감정가율"
                value={testData.appraisalRate}
                maxValue={100}
                unit="%"
                color="#F59E0B"
              />
            </div>
          </div>

          {/* 사용법 안내 */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              💡 사용법:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 슬라이더로 데이터 값을 조정해보세요</li>
              <li>• "랜덤 데이터 생성" 버튼으로 다양한 값 테스트</li>
              <li>• 원형 차트의 시각적 표현을 확인하세요</li>
              <li>• 실제 경매 결과에서 사용될 스타일입니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
