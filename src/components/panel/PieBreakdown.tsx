"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#4ba9db", "#93bb4f", "#e0a72c", "#d5493f", "#7c7a75", "#276e9a"];

export function PieBreakdown({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  return (
    <div className="h-56" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e6e4",
              fontFamily: "Vazirmatn",
            }}
          />
          <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
