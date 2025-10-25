/**
 * 숫자 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 천단위 콤마가 포함된 문자열로 변환
 * @param value - 포맷팅할 숫자
 * @returns 천단위 콤마가 포함된 문자열
 */
export function formatNumber(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";

  return numValue.toLocaleString("ko-KR");
}

/**
 * 천단위 콤마가 포함된 문자열을 숫자로 변환
 * @param value - 콤마가 포함된 문자열
 * @returns 숫자
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;

  // 콤마 제거 후 숫자로 변환
  const cleanValue = value.replace(/,/g, "");
  const numValue = parseFloat(cleanValue);

  return isNaN(numValue) ? 0 : numValue;
}

/**
 * 입력 필드에서 사용할 포맷팅된 값 반환
 * @param value - 입력값
 * @returns 포맷팅된 문자열
 */
export function getFormattedInputValue(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";

  return numValue.toLocaleString("ko-KR");
}
