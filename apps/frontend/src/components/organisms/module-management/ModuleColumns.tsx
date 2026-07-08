import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

// will be an array of
// Cours info and an array of all modules
export interface ModuleTableData {
  modules: moduleDTO;
  events: EventResponse[];
}

const columnCreator = createColumnHelper<ModuleTableData>();

function moduleCodeCol(): ColumnDef<ModuleTableData, string> {
  return columnCreator.accessor("modules.moduleCode", {
    header: "Code",
    cell: (info) => {
      const name = info.getValue();
      return <div>{name}</div>;
    },
  });
}
function moduleNameCol(): ColumnDef<ModuleTableData, string> {
  return columnCreator.accessor("modules.moduleName", {
    header: "Name",
    cell: (info) => {
      const Dname = info.getValue();
      return <div>{Dname}</div>;
    },
  });
}

function eventsCol(): ColumnDef<ModuleTableData, EventResponse[]> {
  return columnCreator.accessor("events", {
    header: "Events",
    cell: (info) => {
      const events = info.getValue();
      return events.map((event) => {
        return (
          <Badge
            className="m-2"
            key={event.eventID}
            style={{
              backgroundColor: info.row.original.modules.styling?.colour,
            }}
          >
            {event.eventCode}
          </Badge>
        );
      });
    },
  });
}
type CourseTableColumn =
  | ColumnDef<ModuleTableData, string>
  | ColumnDef<ModuleTableData, EventResponse[]>;
export const moduleCols: CourseTableColumn[] = [
  moduleCodeCol(),
  moduleNameCol(),
  eventsCol(),
];
