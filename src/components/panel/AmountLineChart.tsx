"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatToman } from "@/lib/validation";

export function AmountLineChart({
  data,
  name,
  color = "#1487c2",
}: {
  data: { label: string; amount: number }[];
  name: string;
  color?: string;
}) {
  if (data.every((d) => d.amount === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e6e4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#7c7a75" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#7c7a75" }}
            tickFormatter={(v: number) => v.toLocaleString("fa-IR")}
            width={70}
          />
          <Tooltip
            formatter={(value) => [formatToman(Number(value)), name]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e6e4",
              fontFamily: "Vazirmatn",
              direction: "rtl",
            }}
            labelStyle={{ fontFamily: "Vazirmatn" }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name={name}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
