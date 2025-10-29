import React from "react";

export interface ActivityStripProps {
  activeUsers: number;
  simsToday: number;
  avgTries: number;
}

export const ActivityStrip: React.FC<ActivityStripProps> = ({ activeUsers, simsToday, avgTries }) => {
  // 🧪 [테스트] KPI 표시 로그
  // eslint-disable-next-line no-console
  console.log("🧪 [테스트] ActivityStrip render", { activeUsers, simsToday, avgTries });

  return (
    <section className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi title="실시간 사용자" value={activeUsers} />
        <Kpi title="오늘 생성된 시뮬레이션" value={simsToday} />
        <Kpi title="평균 시도/유저" value={avgTries} />
      </div>
    </section>
  );
};

const Kpi: React.FC<{ title: string; value: number }> = ({ title, value }) => {
  return (
    <div className="rounded-2xl shadow-sm border border-black/5 p-5 bg-white">
      <div className="text-sm text-[#5B6475]">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
};

export default ActivityStrip;


