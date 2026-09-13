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

export const eventCols: ColumnDef<EventResponse, string>[] = [
  eventCodeCol(),
  eventNameCol(),
];
