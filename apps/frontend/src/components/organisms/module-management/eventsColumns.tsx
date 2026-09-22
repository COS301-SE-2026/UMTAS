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
  return columnCreator.accessor((row) => row.eventCriteria?.date ?? "", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const date = info.getValue();
      return <div>{date}</div>;
    },
  });
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
