/**
 * 숫자 포맷팅 유틸리티 함수들
 *
 * 중요: 계산 로직에서는 순수 숫자(number)만 사용하고,
 * 화면 표시(display)에서만 이 함수들을 사용합니다.
 */

/** 한국 원화 금액을 숫자로 변환 (모든 비숫자 문자 제거) - 내부 헬퍼 함수 */
export function toKRWNumber(v: string | number | undefined | null): number {
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}

/**
 * 숫자를 천단위 콤마가 포함된 문자열로 변환 (화면 표시용)
 * @param value - 포맷팅할 숫자 (number 타입만 허용)
 * @returns 천단위 콤마가 포함된 문자열 (예: "1,000,000")
 */
export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "";
  if (value === 0) return "0";

  return value.toLocaleString("ko-KR");
}

/**
 * 숫자를 천단위 콤마와 '원' 단위가 포함된 문자열로 변환 (화면 표시용)
 * @param value - 포맷팅할 숫자 (number 타입만 허용)
 * @returns 천단위 콤마와 '원' 단위가 포함된 문자열 (예: "1,000,000원")
 */
export function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "";
  if (value === 0) return "0원";

  return `${value.toLocaleString("ko-KR")}원`;
}

/**
 * 천단위 콤마가 포함된 문자열을 숫자로 변환 (입력 파싱용)
 * @param value - 콤마가 포함된 문자열 (예: "1,000,000" 또는 "1,000,000원")
 * @returns 숫자
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  return toKRWNumber(value);
}

/**
 * 입력 필드에서 사용할 포맷팅된 값 반환 (입력 필드용)
 * @param value - 입력값 (숫자 또는 문자열)
 * @returns 포맷팅된 문자열 (예: "1,000,000")
 */
export function getFormattedInputValue(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";

  // 문자열인 경우 숫자로 파싱
  const numValue = typeof value === "string" ? toKRWNumber(value) : value;
  if (
    isNaN(numValue) ||
    (numValue === 0 &&
      String(value).trim() !== "0" &&
      String(value).trim() !== "")
  ) {
    return "";
  }

  return numValue.toLocaleString("ko-KR");
}
