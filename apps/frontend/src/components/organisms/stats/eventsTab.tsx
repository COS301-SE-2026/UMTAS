import { BookOpen, Calendar, Flame, TrendingUp } from "lucide-react";
import StatCard from "./statCard";
import DynamicChart from "@/components/molecules/stats/newStatsChart";

export interface WeekStatsData {
  count: number;
  day: string;
}

export interface VenueStatsData {
  eventCount: number;
  venue: string;
  predictedAttendance: number;
}

export interface EventsTabProps {
  weekData?: WeekStatsData[];
  isLoadingWeek?: boolean;
  isLoadingVenue?: boolean;
  isErrorWeek?: boolean;
  isErrorVenue?: boolean;
  venueData?: VenueStatsData[];
}

export default function EventsTab({
  venueData,
  weekData,
  isLoadingVenue,
  isErrorVenue,
  isErrorWeek,
  isLoadingWeek,
}: EventsTabProps) {
  const week = weekData ?? [];
  const venues = venueData ?? [];

  const busiestDay = [...week].sort((x, y) => y.count - x.count)[0];

  const busiestVenueByEvents = [...venues].sort(
    (x, y) => y.eventCount - x.eventCount,
  )[0];

  const busiestVenueByAttendance = [...venues].sort(
    (x, y) => y.predictedAttendance - x.predictedAttendance,
  )[0];

  const totalEventsThisWeek = week.reduce(
    (total, week) => total + week.count,
    0,
  );

  const weekChartData = week.map((week) => ({
    xKey: week.day,
    count: week.count,
  }));

  const venueChartData = venues.map((venue) => ({
    xKey: venue.venue,
    eventCount: venue.eventCount,
    predictedAttendance: venue.predictedAttendance,
  }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Event Count this Week"
          value={totalEventsThisWeek ?? 0}
          isLoading={isLoadingWeek}
          icon={<BookOpen className={"h-4 w-4"} />}
        />
        <StatCard
          title="Busiest day"
          value={busiestDay?.count ?? 0}
          description={busiestDay?.day ?? ""}
          isLoading={isLoadingWeek}
          icon={<Calendar className={"h-4 w-4"} />}
        />
        <StatCard
          title="Busiest Venue by Events"
          value={busiestVenueByEvents?.venue ?? ""}
          description={`${busiestVenueByEvents?.eventCount ?? 0} events`}
          isLoading={isLoadingVenue}
          icon={<Flame className={"h-4 w-4"} />}
        />
        <StatCard
          title="Busiest Venue by Attendance"
          value={busiestVenueByAttendance?.venue}
          description={`${busiestVenueByAttendance?.eventCount ?? 0} events`}
          isLoading={isLoadingVenue}
          icon={<TrendingUp className={"h-4 w-4"} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DynamicChart
          title="Events by Day of Week"
          description="Event Distribution this Week"
          type="line"
          data={weekChartData}
          config={{
            count: { label: "Events", color: "var(--chart-3)" },
          }}
          xKey="xKey"
          yKey={["count"]}
          isLoading={isLoadingWeek}
          emptyMessage="No events data available for this week"
          height={300}
        />
        <DynamicChart
          title="Events and Predicted Attendance by Venue"
          description="From schedules data"
          type="bar-grouped"
          data={venueChartData}
          config={{
            eventCount: { label: "Events", color: "var(--chart-1)" },
            predictedAttendance: {
              label: "Predicted Attendance",
              color: "var(--chart-2)",
            },
          }}
          xKey="xKey"
          yKey={["eventCount", "predictedAttendance"]}
          isLoading={isLoadingVenue}
          emptyMessage="No module data available"
          height={400}
        />
      </div>
    </div>
  );
}
