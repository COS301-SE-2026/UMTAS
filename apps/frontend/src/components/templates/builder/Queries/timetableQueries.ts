import {
  getAllTimeTablesBuilder,
  getTTbyIdBuilder,
  updateTTbyIDBuilder,
  deleteTTbyIDBuilder,
  createTimeTableBuilder,
  createTimeTableBody,
} from "@/app/builder/utils/timetables/TimeTableRequests";

import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { validators } from "tailwind-merge";

export function getAllTimetablesQ() {
  return queryOptions({
    queryKey: ["timetables"] as const,
    queryFn: async () =>
      (await new getAllTimeTablesBuilder().send({})).timetables,
  });
}

export function addTimetableMut() {
  return mutationOptions({
    mutationFn: async (vars: { body: createTimeTableBody }) => {
      const builder = new createTimeTableBuilder();
      return await builder.send({
        body: vars.body,
      });
    },

    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: getAllTimetablesQ().queryKey,
      });
    },
    onError: (error) =>
      console.error("mutation failed for adding timetable", error),
  });
}

// export function removeTimetableMut(){
//     return mutationOptions({
//         mutationFn: async (timeTableId : string | null) =>{
//             if (timeTableId == null){
//                 return;
//             }
//             return new deleteTTbyIDBuilder().send({
//                 paths: {
//                     id : timeTableId,
//                 }
//             })
//         }
//     })
// }