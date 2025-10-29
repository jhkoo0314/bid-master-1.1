import React from "react";

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-2xl border border-black/5 overflow-hidden animate-pulse bg-white">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-6 bg-gray-100 rounded" />
          <div className="h-6 bg-gray-100 rounded" />
          <div className="h-6 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;


