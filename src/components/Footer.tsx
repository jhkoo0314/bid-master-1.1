/**
 * Footer 컴포넌트 - 개인정보 처리방침, 이용약관, 문의하기 링크포함
 */

"use client";

import Link from "next/link";

export default function Footer() {
  const handleLinkClick = (linkName: string) => {
    console.log(`🔗 [푸터] ${linkName} 링크 클릭`);
  };

  return (
    <footer className="border-t border-gray-200 py-8 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 하단 링크들 */}
        <div className="flex flex-col items-center space-y-4">
          {/* 링크들 */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <Link
              href="/privacy-policy"
              onClick={() => handleLinkClick("개인정보 처리방침")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              개인정보 처리방침
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link
              href="/terms-of-service"
              onClick={() => handleLinkClick("이용약관")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              이용약관
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link
              href="/contact"
              onClick={() => handleLinkClick("문의하기")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              문의하기
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link
              href="/guide"
              onClick={() => handleLinkClick("실전 가이드")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              실전 가이드
            </Link>
          </div>

          {/* 저작권 정보 */}
          <p className="text-gray-500 text-xs text-center">
            © 2025 Bid Master AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
