import React from "react";

export interface EmptyStateProps {
  onCreate?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => {
  // eslint-disable-next-line no-console
  console.log("🧪 [테스트] 빈 결과 표시");
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h3 className="text-lg font-semibold">조건에 맞는 매물이 없습니다</h3>
      <p className="mt-2 text-[#5B6475]">필터를 넓히거나 새로 생성해보세요.</p>
      <div className="mt-6">
        <button
          className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 빈 상태에서 매물 생성 시도");
            onCreate?.();
          }}
        >
          AI로 새 매물 생성
        </button>
      </div>
    </div>
  );
};

export default EmptyState;


