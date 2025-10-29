import React from "react";
import type { RightRow, TableProps } from "@/types/property";

export default function RightsTable({ data, loading, emptyMessage = "권리 정보가 없습니다." }: TableProps<RightRow>) {
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
            <th scope="col" className="px-4 py-2">순위</th>
            <th scope="col" className="px-4 py-2">권리종류</th>
            <th scope="col" className="px-4 py-2">권리자</th>
            <th scope="col" className="px-4 py-2">등기일</th>
            <th scope="col" className="px-4 py-2">청구금액</th>
            <th scope="col" className="px-4 py-2">비고</th>
          </tr>
        </thead>
        <tbody className="text-[#0B1220]">
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-black/5">
              <td className="px-4 py-2 whitespace-nowrap">{row.order}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.type}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.holder}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-2 whitespace-nowrap tabular-nums">{new Intl.NumberFormat("ko-KR").format(row.claim)}원</td>
              <td className="px-4 py-2">{row.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
