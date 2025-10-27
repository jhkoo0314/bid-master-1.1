/**
 * Bid Master AI - 모바일 하단 네비게이션 바
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);

      // 해시 변경 감지
      const handleHashChange = () => {
        setCurrentHash(window.location.hash);
      };

      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  const navItems = [
    {
      href: "/",
      label: "홈",
      icon: "🏠",
      isActive: pathname === "/",
    },
    {
      href: "/calculator",
      label: "계산기",
      icon: "🧮",
      isActive: pathname === "/calculator",
    },
    {
      href: "#properties",
      label: "매물",
      icon: "🏢",
      isActive: pathname === "/" && currentHash === "#properties",
    },
    {
      href: "#waitlist",
      label: "알림",
      icon: "🔔",
      isActive: false,
    },
  ];

  const handleNavClick = (href: string, label: string) => {
    console.log(`📱 [모바일 네비게이션] ${label} 클릭: ${href}`);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => handleNavClick(item.href, item.label)}
            className={`flex flex-col items-center justify-center py-2 px-3 min-h-[44px] min-w-[44px] transition-colors ${
              item.isActive
                ? "text-blue-600 bg-blue-50 rounded-lg"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
