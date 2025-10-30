import React from "react";
import type { PayoutRow, TableProps } from "@/types/property";

export default function PayoutTable({
  data,
  loading,
  emptyMessage = "배당 정보가 없습니다.",
}: TableProps<PayoutRow>) {
  if (loading) {
    return <div className="text-sm text-[#5B6475]">로딩 중...</div>;
  }
  if (!data || data.length === 0) {
    return <div className="text-sm text-[#5B6475]">{emptyMessage}</div>;
  }
  const totalExpected = data.reduce((sum, r) => sum + (r.expected || 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[#5B6475]">
            <th scope="col" className="px-4 py-2">
              순위
            </th>
            <th scope="col" className="px-4 py-2">
              권리자
            </th>
            <th scope="col" className="px-4 py-2">
              권리종류
            </th>
            <th scope="col" className="px-4 py-2">
              청구금액
            </th>
            <th scope="col" className="px-4 py-2">
              예상배당
            </th>
            <th scope="col" className="px-4 py-2">
              비고
            </th>
          </tr>
        </thead>
        <tbody className="text-[#0B1220]">
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-black/10">
              <td className="px-4 py-2 whitespace-nowrap">{row.order}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.holder}</td>
              <td className="px-4 py-2 whitespace-nowrap">{row.type}</td>
              <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                {new Intl.NumberFormat("ko-KR").format(row.claim)}원
              </td>
              <td className="px-4 py-2 whitespace-nowrap tabular-nums font-semibold">
                {new Intl.NumberFormat("ko-KR").format(row.expected)}원
              </td>
              <td className="px-4 py-2">{row.remark || "-"}</td>
            </tr>
          ))}
          <tr className="border-t border-black/10">
            <td className="px-4 py-2" colSpan={4}>
              합계
            </td>
            <td className="px-4 py-2 whitespace-nowrap tabular-nums font-semibold">
              {new Intl.NumberFormat("ko-KR").format(totalExpected)}원
            </td>
            <td className="px-4 py-2">-</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-[#5B6475]">
        실제 배당은 낙찰대금에 따라 변동됩니다.
      </p>
    </div>
  );
}
