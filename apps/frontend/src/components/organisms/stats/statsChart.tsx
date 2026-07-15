import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import StatCard from "@/components/organisms/stats/statCard";

interface Chart {
  title: string;
  description?: string;
  footer?: string;
  className?: string;
  type: "line" | "area" | "bar" | "pie" | "donut" | "heatmap" | "radar"; //willie we can add more chart types from apexcharts here
  series: ApexOptions["series"];
  height?: number | string;
  customOptions?: ApexOptions;
}

export default function ReusableChart({
  title,
  description,
  footer,
  className,
  type,
  series,
  height = 350,
  customOptions = {},
}: Chart) {
  const baseOptions: ApexOptions = {
    chart: {
      toolbar: { show: false },
      fontFamily: "inherit",
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
    ...customOptions,
  };

  return (
    <StatCard
      title={title}
      description={description}
      footer={footer}
      className={className}
    >
      <ReactApexChart
        type={type}
        height={height}
        series={series}
        options={baseOptions}
      />
    </StatCard>
  );
}
