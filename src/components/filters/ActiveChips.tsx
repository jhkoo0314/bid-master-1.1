"use client";

import React from "react";

export interface ActiveChipsProps {
  chips: { id: string; label: string }[];
  onRemove?: (id: string) => void;
}

export const ActiveChips: React.FC<ActiveChipsProps> = ({
  chips,
  onRemove,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          aria-label={`${chip.label} 필터 제거`}
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("[사용자 액션] 칩 제거", chip.id);
            onRemove?.(chip.id);
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-3 py-1 text-sm hover:bg-gray-50"
        >
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  );
};

export default ActiveChips;
