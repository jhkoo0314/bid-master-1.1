export function capBidPriceByPolicy(fmv: number, lowestBid: number) {
  const capByFMV = Math.floor(fmv * 0.95);
  const capByLowest = Math.ceil(lowestBid * 1.05);
  // 상한은 두 값 중 더 작은 값
  return Math.min(capByFMV, capByLowest);
}




