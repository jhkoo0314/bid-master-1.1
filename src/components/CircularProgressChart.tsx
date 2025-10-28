import { ResponsiveContainer, Cell, Pie, PieChart } from "recharts";

interface CircularProgressChartProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  color?: string;
}

export function CircularProgressChart({
  label,
  value,
  maxValue,
  unit = "",
  color = "#3B82F6",
}: CircularProgressChartProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const data = [
    { name: "filled", value: percentage, fill: color },
    { name: "empty", value: 100 - percentage, fill: "#E5E7EB" },
  ];

  console.log(
    `📊 [그래프] ${label} 차트 렌더링: ${value}${unit} (${percentage}%)`
  );

  return (
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={30}
              startAngle={90}
              endAngle={450}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-lg font-bold text-gray-900">
          {value}
          {unit}
        </div>
      </div>
    </div>
  );
}
