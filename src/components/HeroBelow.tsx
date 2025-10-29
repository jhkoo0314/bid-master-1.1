import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// 매물 데이터 타입 정의
interface PropertyData {
  appraisal: number; // 감정가 (억원)
  competitionRate: number; // 경쟁률
  bidRate: number; // 입찰가율 (%)
  location: string; // 지역
  propertyType: string; // 매물 유형
}

interface HeroBelowProps {
  activeUsers: number;
}

export default function HeroBelow({ activeUsers }: HeroBelowProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [propertyData, setPropertyData] = useState<{
    A: PropertyData;
    B: PropertyData;
  } | null>(null);

  // 매물 데이터 생성 함수
  const generatePropertyData = (): { A: PropertyData; B: PropertyData } => {
    const locations = [
      "서울 강남구",
      "서울 서초구",
      "서울 송파구",
      "부산 해운대구",
      "대구 수성구",
      "인천 연수구",
      "광주 서구",
      "대전 유성구",
    ];
    const propertyTypes = [
      "아파트",
      "빌라",
      "단독주택",
      "오피스텔",
      "상가",
      "원룸",
    ];

    const generateSingleProperty = (): PropertyData => {
      const appraisal = Math.floor(Math.random() * 3) + 1.5; // 1.5억 ~ 4.5억
      const competitionRate = Math.floor(Math.random() * 15) + 3; // 3:1 ~ 17:1
      const bidRate = Math.floor(Math.random() * 20) + 75; // 75% ~ 94%

      return {
        appraisal,
        competitionRate,
        bidRate,
        location: locations[Math.floor(Math.random() * locations.length)],
        propertyType:
          propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      };
    };

    return {
      A: generateSingleProperty(),
      B: generateSingleProperty(),
    };
  };

  // 클라이언트 사이드 초기화
  useEffect(() => {
    // 클라이언트 사이드 렌더링 확인
    setIsClient(true);

    // 매물 데이터 생성
    setPropertyData(generatePropertyData());
    console.log("🎯 [감각테스트] 페이지 로드 시 매물 데이터 생성 완료");

    // 실패기록 데이터 생성
    setFailLogs(generateFailLogs());
  }, []);

  const testResult = propertyData
    ? selected === "A"
      ? `❌ 안타깝네요. ${propertyData.A.location} ${propertyData.A.propertyType}는 경쟁률이 ${propertyData.A.competitionRate}:1로 너무 높았습니다.`
      : selected === "B"
      ? `🎯 정확합니다! ${propertyData.B.location} ${propertyData.B.propertyType}는 입찰가율 ${propertyData.B.bidRate}%로 최적화되었습니다!`
      : null
    : null;

  // 동적 실패기록 생성 함수
  const generateFailLogs = () => {
    console.log("🎲 [실패기록] 메인화면 실패기록 데이터 생성 시작");

    const names = [
      "김**",
      "박**",
      "이**",
      "최**",
      "정**",
      "한**",
      "윤**",
      "조**",
      "강**",
      "임**",
    ];
    const locations = [
      "서울 강남구",
      "서울 서초구",
      "서울 송파구",
      "부산 해운대구",
      "대구 수성구",
      "인천 연수구",
    ];
    const propertyTypes = [
      "아파트",
      "빌라",
      "단독주택",
      "오피스텔",
      "상가",
      "원룸",
    ];
    const failureTypes = [
      "감정가보다 25% 높게 입찰",
      "경쟁률 12:1로 과열",
      "입찰가 누락으로 무효 처리",
      "서류 미비로 제외",
      "보증금 부족으로 탈락",
      "경매 참가 자격 미달",
      "입찰 마감 시간 초과",
      "경매장 미참석으로 실패",
    ];
    const successTypes = [
      "감정가 2.1억 → 낙찰가 1.68억",
      "경쟁률 3:1로 적정 수준",
      "입찰가율 85%로 최적화",
      "감정가 대비 20% 할인 낙찰",
      "경매 참가자 적어 유리",
      "입찰 마감 직전 성공",
    ];

    const logs = [];
    const logCount = Math.floor(Math.random() * 3) + 3; // 3-5개

    for (let i = 0; i < logCount; i++) {
      const isSuccess = Math.random() < 0.3; // 30% 확률로 성공
      const name = names[Math.floor(Math.random() * names.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const propertyType =
        propertyTypes[Math.floor(Math.random() * propertyTypes.length)];

      if (isSuccess) {
        const successType =
          successTypes[Math.floor(Math.random() * successTypes.length)];
        logs.push(
          `🎯 ${name} — ${location} ${propertyType}, ${successType} (성공)`
        );
      } else {
        const failureType =
          failureTypes[Math.floor(Math.random() * failureTypes.length)];
        logs.push(
          `💸 ${name} — ${location} ${propertyType}, ${failureType} (실패)`
        );
      }
    }

    console.log(`✅ [실패기록] ${logs.length}개 실패기록 생성 완료`);
    return logs;
  };

  const [failLogs, setFailLogs] = useState<string[]>([]);

  const handleSelection = (option: string) => {
    console.log(`🎯 [감각테스트] 매물 ${option} 선택`);
    setSelected(option);
  };

  return (
    <section className="bg-[#f8fafc] py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* 1️⃣ 실패 보관소 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-20 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            실패의 기록 보관소
          </h2>
          <p className="text-gray-500 mb-8">
            실전처럼, 누구나 한 번쯤은 실패합니다. 감각은 실패 위에서
            단단해집니다.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-left p-6">
            {failLogs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                실패기록을 생성하는 중...
              </div>
            ) : (
              failLogs.map((log, i) => (
                <p
                  key={i}
                  className={`text-sm py-1 ${
                    log.includes("성공") ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {log}
                </p>
              ))
            )}
          </div>
        </motion.div>

        {/* 2️⃣ 감각 테스트 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-24 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            당신의 낙찰 감각은?
          </h2>
          <p className="text-gray-500 mb-10">
            아래 두 매물 중, 낙찰 확률이 더 높다고 생각되는 쪽을 선택하세요.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6">
            {propertyData ? (
              ["A", "B"].map((opt) => {
                const data = opt === "A" ? propertyData.A : propertyData.B;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelection(opt)}
                    aria-label={`매물 ${opt} 선택 - ${data.location} ${data.propertyType}, 감정가 ${data.appraisal}억, 경쟁률 ${data.competitionRate}:1`}
                    className={`flex-1 max-w-sm border-2 rounded-xl p-6 text-left transition hover:shadow-lg ${
                      selected === opt
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                      매물 {opt}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">
                      {data.location} {data.propertyType}
                    </p>
                    <p className="text-gray-500 text-sm">
                      감정가 {data.appraisal}억 | 경쟁률 {data.competitionRate}
                      :1 | 입찰가율 {data.bidRate}%
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col md:flex-row justify-center gap-6">
                <div className="flex-1 max-w-sm border-2 rounded-xl p-6 bg-gray-100 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="flex-1 max-w-sm border-2 rounded-xl p-6 bg-gray-100 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            )}
          </div>

          {testResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-lg font-medium text-blue-700"
            >
              {testResult}
            </motion.p>
          )}
        </motion.div>

        {/* 3️⃣ 실시간 현황 맵 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            지금 훈련 중인 사용자
          </h2>
          <p className="text-gray-500 mb-8">
            현재 <span className="font-bold text-blue-600">{activeUsers}</span>
            명이 감각 훈련 중입니다.
          </p>

          <div className="relative mx-auto w-full max-w-md h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-inner">
            {isClient &&
              [...Array(30)].map((_, i) => {
                // 고정된 시드로 일관된 랜덤 값 생성
                const seed = i * 123.456;
                const x1 = (Math.sin(seed) * 0.5 + 0.5) * 300;
                const y1 = (Math.cos(seed * 1.3) * 0.5 + 0.5) * 200;
                const x2 = (Math.sin(seed * 1.7) * 0.5 + 0.5) * 300;
                const y2 = (Math.cos(seed * 2.1) * 0.5 + 0.5) * 200;
                const duration = 3 + (Math.sin(seed * 3.14) * 0.5 + 0.5) * 2;

                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-70"
                    initial={{
                      x: x1,
                      y: y1,
                    }}
                    animate={{
                      x: x2,
                      y: y2,
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: duration,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
