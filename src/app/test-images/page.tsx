/**
 * Bid Master AI - 이미지 테스트 페이지
 * 매물 유형별 고유 이미지 생성 테스트
 */

"use client";

import { useState } from "react";
import {
  searchUniquePropertyImage,
  clearPropertyImageCache,
  clearCommercialPropertyCache,
  getCacheStatus,
} from "@/lib/unsplash-client";

const propertyTypes = [
  "아파트",
  "오피스텔",
  "상가",
  "단독주택",
  "빌라",
  "원룸",
];
const testLocations = [
  "서울 강남구",
  "경기 성남시",
  "부산 해운대구",
  "대구 수성구",
];

export default function TestImagesPage() {
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, number>>({});

  const testImageGeneration = async (
    propertyType: string,
    location: string
  ) => {
    const key = `${propertyType}-${location}`;
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError(null);

    try {
      console.log(`🖼️ [테스트] ${propertyType} - ${location} 이미지 생성 시작`);

      const imageUrl = await searchUniquePropertyImage(
        propertyType,
        location,
        1000000000 // 10억원으로 테스트
      );

      setImages((prev) => ({ ...prev, [key]: imageUrl }));
      console.log(
        `✅ [테스트] ${propertyType} - ${location} 이미지 생성 완료: ${imageUrl}`
      );
    } catch (err) {
      console.error(
        `❌ [테스트] ${propertyType} - ${location} 이미지 생성 실패:`,
        err
      );
      setError(`${propertyType} - ${location} 이미지 생성 실패`);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const testAllImages = async () => {
    console.log("🚀 [테스트] 모든 매물 유형별 이미지 생성 시작");

    for (const propertyType of propertyTypes) {
      for (const location of testLocations) {
        await testImageGeneration(propertyType, location);
        // API 호출 간격 조절 (1초 대기)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("✅ [테스트] 모든 이미지 생성 완료");
  };

  const clearCache = (propertyType?: string) => {
    clearPropertyImageCache(propertyType);
    setCacheStatus(getCacheStatus());
    console.log(`🗑️ [테스트] 캐시 초기화 완료: ${propertyType || "전체"}`);
  };

  const checkCacheStatus = () => {
    const status = getCacheStatus();
    setCacheStatus(status);
    console.log(`📊 [테스트] 캐시 상태 확인:`, status);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          매물 유형별 고유 이미지 테스트
        </h1>

        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={testAllImages}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            모든 매물 유형 이미지 생성 테스트
          </button>

          <button
            onClick={() => clearCache()}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ 전체 캐시 초기화
          </button>

          <button
            onClick={() => clearCache("상가")}
            className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
          >
            🏪 상가 캐시만 초기화
          </button>

          <button
            onClick={() => {
              clearCommercialPropertyCache();
              setCacheStatus(getCacheStatus());
              console.log(`🏢 [테스트] 상가 매물 유형 캐시 강제 초기화 완료`);
            }}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
          >
            🏢 상가 강제 캐시 초기화 (새 검색어 적용)
          </button>

          <button
            onClick={checkCacheStatus}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 캐시 상태 확인
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertyTypes.map((propertyType) => (
            <div
              key={propertyType}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {propertyType}
              </h2>

              <div className="space-y-4">
                {testLocations.map((location) => {
                  const key = `${propertyType}-${location}`;
                  const imageUrl = images[key];
                  const isLoading = loading[key];

                  return (
                    <div key={location} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {location}
                        </span>
                        <button
                          onClick={() =>
                            testImageGeneration(propertyType, location)
                          }
                          disabled={isLoading}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {isLoading ? "생성중..." : "이미지 생성"}
                        </button>
                      </div>

                      {imageUrl ? (
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={`${propertyType} - ${location}`}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              console.log(
                                `❌ [테스트] 이미지 로드 실패: ${imageUrl}`
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                            {propertyType}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {isLoading ? "이미지 생성중..." : "이미지 없음"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            테스트 결과 요약
          </h3>
          <div className="text-sm text-blue-800">
            <p>• 총 생성된 이미지: {Object.keys(images).length}개</p>
            <p>• 매물 유형별 고유 이미지 보장</p>
            <p>• 중복 방지 캐싱 시스템 적용</p>
            <p>• Unsplash API를 통한 고품질 이미지</p>
          </div>
        </div>

        {Object.keys(cacheStatus).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              캐시 상태
            </h3>
            <div className="text-sm text-gray-700">
              {Object.entries(cacheStatus).map(([propertyType, count]) => (
                <p key={propertyType}>
                  • {propertyType}: {count}개 이미지 사용됨
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
