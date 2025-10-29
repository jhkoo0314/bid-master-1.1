import React from "react";
import type { ScheduleItem, TableProps } from "@/types/property";

export default function ScheduleTable({ data, loading, emptyMessage = "일정 정보가 없습니다." }: TableProps<ScheduleItem>) {
  if (loading) {
    return <div className="text-sm text-[#5B6475]">로딩 중...</div>;
  }
  if (!data || data.length === 0) {
    return <div className="text-sm text-[#5B6475]">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[#5B6475]">
            <th scope="col" className="px-4 py-2">일정</th>
            <th scope="col" className="px-4 py-2">제목</th>
            <th scope="col" className="px-4 py-2">날짜</th>
            <th scope="col" className="px-4 py-2">비고</th>
          </tr>
        </thead>
        <tbody className="text-[#0B1220]">
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-black/5">
              <td className="px-4 py-2 whitespace-nowrap">{row.day}</td>
              <td className="px-4 py-2 min-w-[16rem]">{row.title}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-2">{row.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
