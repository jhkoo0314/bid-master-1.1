"use client";
import React from "react";

interface InfoTipProps {
  title: string;
  description: string;
}

export default function InfoTip({ title, description }: InfoTipProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={title}
        className="ml-1 text-[10px] leading-none w-4 h-4 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-50"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-64 p-2 text-xs bg-white border border-gray-300 rounded shadow">
          <div className="font-medium text-gray-900 mb-1">{title}</div>
          <div className="text-gray-700 whitespace-pre-line">{description}</div>
        </div>
      )}
    </span>
  );
}


