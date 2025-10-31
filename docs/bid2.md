{/* 하단 리포트 카드 탭 3개 */}
<div className="w-full max-w-4xl grid grid-cols-3 gap-4">
{[{
key: "right",
label: "권리분석 리포트",
color: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
},
{
key: "auction",
label: "경매분석 리포트",
color: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
},
{
key: "profit",
label: "수익분석 리포트",
color: "bg-[#FFF7ED] text-[#B45309] border-[#FCD34D]",
}].map((tab) => (
<div
key={tab.key}
onClick={() => setActiveTab(tab.key)}
className={`rounded-xl border p-5 cursor-pointer text-center transition-all duration-200 hover:shadow-md ${tab.color} ${activeTab === tab.key ? 'ring-2 ring-offset-2 ring-[#0B1220]' : ''}`}
>
<h3 className="text-base font-semibold mb-1">{tab.label}</h3>
<p className="text-sm opacity-80">
{tab.key === "right" && "등기부와 임차인 정보를 기반으로 인수권리와 말소기준권리를 분석합니다."}
{tab.key === "auction" && "입찰경쟁률, 법적 리스크, 명도난이도를 종합 평가합니다."}
{tab.key === "profit" && "총인수금액, 안전마진, ROI를 계산해 예상 수익률을 제시합니다."}
</p>
<button className="mt-3 text-xs font-medium underline hover:opacity-80">
자세히 보기 →
</button>
</div>
))}
</div>
</div>
);
}