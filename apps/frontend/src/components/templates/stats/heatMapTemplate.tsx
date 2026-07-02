import React from "react";
import ReusableChart from "@/components/organisms/stats/statsChart";

export default function HeatMapTemplate() {
  return (
    //just an example of for example a heat map for our stats page

    <ReusableChart
      title="Clash Heatmap"
      description="Conflicts by day and time"
      footer="Data represents the number of conflicts recorded in the system."
      type="heatmap"
      height={550}
      series={[
        { name: "Mon", data: [3, 8, 2, 1, 0] },
        { name: "Tue", data: [1, 2, 5, 2, 1] },
        { name: "Wed", data: [0, 4, 3, 6, 2] },
        { name: "Thu", data: [2, 1, 1, 4, 5] },
        { name: "Fri", data: [1, 0, 2, 1, 3] },
      ]}
      customOptions={{
        xaxis: {
          categories: ["8AM", "10AM", "12PM", "2PM", "4PM"],
          labels: { style: { fontSize: "10px" } },
        },
        yaxis: {
          labels: { style: { fontSize: "10px" } },
        },
        colors: ["#FF4560"],
      }}
    />
  );
}
