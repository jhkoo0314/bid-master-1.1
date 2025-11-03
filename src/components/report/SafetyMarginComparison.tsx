"use client";

import React from "react";
import SafetyMarginCard from "./SafetyMarginCard";

type MarginItem = {
  amount: number;
  pct: number;
  referencePrice: number;
  bidPrice?: number;
};

export default function SafetyMarginComparison(props: {
  fmv: MarginItem;
  exit: MarginItem;
  user: MarginItem;
}) {
  const sameAsFMV = props.fmv.amount === props.user.amount;

  // ✅ 입찰가(bidPrice) > FMV → 과열입찰 경고 조건 (수정된 코드)
  const overFMV =
    typeof props.user.bidPrice === "number" &&
    typeof props.fmv.referencePrice === "number" &&
    props.user.bidPrice > props.fmv.referencePrice;

  // console.log({ bid: props.user.bidPrice, fmv: props.fmv.referencePrice, overFMV });

  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold mb-3">안전마진 비교</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-2">
        <SafetyMarginCard
          title="FMV 기준"
          amount={props.fmv.amount}
          pct={props.fmv.pct}
          referencePriceLabel="FMV"
          referencePrice={props.fmv.referencePrice}
          tooltip="FMV(현재 시세) 기준: FMV − 총인수금액"
        />
        <SafetyMarginCard
          title="Exit 기준"
          amount={props.exit.amount}
          pct={props.exit.pct}
          referencePriceLabel="Exit"
          referencePrice={props.exit.referencePrice}
          tooltip="Exit(미래 예상 매각가) 기준: Exit − 총인수금액"
        />
        <SafetyMarginCard
          title="현재 입찰가 기준"
          amount={props.user.amount}
          pct={props.user.pct}
          referencePriceLabel="FMV"
          referencePrice={props.user.referencePrice}
          isOverFMV={overFMV}
          tooltip="입찰가 기준: FMV − 입찰가 (입찰가가 FMV와 비슷하면 동일하게 표시될 수 있습니다)"
        />
      </div>

      {/* ✅ FMV와 USER MoS 값이 동일하면 자동 안내문 표시 */}
      {sameAsFMV && (
        <p className="text-xs text-muted-foreground mt-2">
          현재 입력된 입찰가가 FMV와 유사하여 FMV 기준 안전마진과 동일하게
          표시될 수 있습니다.
        </p>
      )}

      {/* ✅ FMV 초과 입찰 경고 메시지 */}
      {overFMV && (
        <p className="text-xs text-red-600 font-medium mt-2">
          ⚠️ 현재 입찰가는 공정시세(FMV)를 초과하고 있어 손실 위험이 있습니다.
        </p>
      )}
    </section>
  );
}
