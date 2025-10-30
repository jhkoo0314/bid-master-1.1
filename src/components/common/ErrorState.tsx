import React from "react";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = "데이터를 불러오지 못했습니다.", onRetry }) => {
  // eslint-disable-next-line no-console
  console.error("❌ [에러] API 실패/검증 오류", message);
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h3 className="text-lg font-semibold">문제가 발생했어요</h3>
      <p className="mt-2 text-[#5B6475]">{message}</p>
      <div className="mt-6">
        <button
          className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 재시도 클릭");
            onRetry?.();
          }}
        >
          재시도
        </button>
      </div>
    </div>
  );
};

export default ErrorState;




