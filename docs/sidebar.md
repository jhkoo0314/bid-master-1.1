const demoSummary = {
risks: [
{ level: 'high', label: '근저당', detail: '설정 1건, 말소 예정이나 확인 필요' },
{ level: 'mid', label: '저당권', detail: '채권최고액 1.8억, 인수 가능성 낮음' },
{ level: 'low', label: '유치권', detail: '신고 없음' },
],
bidRange: { min: 328286047, max: 362842473 },
roi: 12.4,
tip: '권장: 1차 입찰가를 하단 범위 중심으로 설정하고, 경쟁률 4~6:1 가정.'
}


const demoSimilar = [
{
id: 'sim1',
title: '송파구 ○○ 오피스텔',
won: 381000000,
rate: '5:1',
roi: 14,
tag: '3개월 전 낙찰',
},
{
id: 'sim2',
title: '강동구 ○○ 주상복합',
won: 347000000,
rate: '3:1',
roi: 9,
tag: '최근 1개월 낙찰',
},
]


// ─────────────────────────────────────────────────────────────
// 유틸
function won(n: number) {
return '₩' + n.toLocaleString()
}


function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'green'|'orange'|'red'|'blue'|'gray'}) {
const map: Record<string, string> = {
green: 'bg-emerald-50 text-emerald-700',
orange: 'bg-orange-50 text-orange-700',
red: 'bg-red-50 text-red-700',
blue: 'bg-blue-50 text-blue-700',
gray: 'bg-gray-100 text-gray-700',
}
return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>
}


// 리스크 레벨 칩 색상 매핑
const riskTone = (level: 'high'|'mid'|'low') => (level === 'high' ? 'red' : level === 'mid' ? 'orange' : 'green')

// ─────────────────────────────────────────────────────────────
// 컴포넌트: 유사 낙찰 사례 리스트
function SimilarCases({ items = demoSimilar }: { items?: typeof demoSimilar }) {
return (
<div className="rounded-2xl border bg-white p-5 shadow-sm">
<div className="mb-3 flex items-center justify-between">
<h3 className="text-base font-semibold">최근 낙찰 사례</h3>
<Badge tone="gray">참고 데이터</Badge>
</div>
<ul className="space-y-3">
{items.map((it) => (
<li key={it.id} className="flex items-start justify-between gap-3 rounded-xl border p-3 hover:shadow-sm">
<div>
<p className="text-sm font-medium text-gray-900">{it.title}</p>
<p className="mt-0.5 text-xs text-gray-500">경쟁률 {it.rate} · 수익률 {it.roi}%</p>
</div>
<div className="text-right">
<p className="text-sm font-semibold">{won(it.won)}</p>
<p className="mt-0.5 text-[11px] text-gray-500">{it.tag}</p>
</div>
</li>
))}
</ul>
</div>
)
}

// ─────────────────────────────────────────────────────────────
// 컴포넌트: CTA 묶음
function Actions({ onPrimary, onSecondary }: { onPrimary?: () => void; onSecondary?: () => void }) {
return (
<div className="flex flex-col gap-3 sm:flex-row">
<button
onClick={onPrimary}
className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
>
추천 입찰가 보기
</button>
<button
onClick={onSecondary}
className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
>
이 물건으로 연습하기
</button>
</div>
)
}