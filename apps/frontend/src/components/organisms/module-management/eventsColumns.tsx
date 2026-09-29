import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

const columnCreator = createColumnHelper<EventResponse>();

function eventNameCol(): ColumnDef<EventResponse, string> {
  return columnCreator.accessor("eventName", {
    header: "Name",
    cell: (info) => {
      const name = info.getValue();
      return <div>{name}</div>;
    },
  });
}
function eventCodeCol(): ColumnDef<EventResponse, string> {
  return columnCreator.accessor("activityCode", {
    header: "Code",
    cell: (info) => {
      const name = info.getValue();
      return <div>{name}</div>;
    },
  });
}
function eventDateCol() {
  return columnCreator.accessor(
    (row) =>
      row.isRecurring
        ? (row.eventCriteria?.dayOfWeek ?? "")
        : (row.eventCriteria?.date ?? ""),
    {
      id: "date",
      header: "Date / Day",
      cell: (info) => {
        const value = info.getValue();

        if (!value) {
          return <div>-</div>;
        }

        if (info.row.original.isRecurring) {
          const day = value.charAt(0).toUpperCase() + value.slice(1);
          return <div>Every {day}</div>;
        }

        return <div>{value}</div>;
      },
    },
  );
}
function eventTimeCol() {
  return columnCreator.accessor(
    (row) => {
      const start = row.eventCriteria?.startTime;
      const end = row.eventCriteria?.endTime;
      if (!start || !end) return "";
      return `${start} - ${end}`;
    },
    {
      id: "time",
      header: "Time",
      cell: (info) => {
        const time = info.getValue();
        return <div>{time}</div>;
      },
    },
  );
}

export const eventCols: ColumnDef<EventResponse, string>[] = [
  eventNameCol(),
  eventCodeCol(),
  eventDateCol(),
  eventTimeCol(),
];
