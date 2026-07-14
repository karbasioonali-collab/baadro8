"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function OrdersChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e6e4" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7c7a75" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#7c7a75" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e7e6e4",
              fontFamily: "Vazirmatn",
              direction: "rtl",
            }}
            labelStyle={{ fontFamily: "Vazirmatn" }}
          />
          <Bar dataKey="count" name="تعداد سفارش" fill="#4ba9db" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
