"use client";
import CustomiseShell from "@/components/templates/customise/CustomiseShell";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/atoms/customise/alert-dialog-customise";

import { useQuery } from "@tanstack/react-query";
import { getAllModulesQ } from "@/components/templates/builder/Queries/moduleQueries";
import { getAllEventsQ } from "@/components/templates/builder/Queries/eventQueries";

export default function CustomiseShellPopup() {
  const { data: modules, isLoading: modulesLoading } =
    useQuery(getAllModulesQ());
  const { data: events, isLoading: eventsLoading } = useQuery(getAllEventsQ());

  const isLoading = modulesLoading || eventsLoading;

  return (
    <div className="">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button id="btn-customise-schedule" variant="outline">
            Customise
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="w-[792px] max-w-[95vw] p-0 flex flex-col gap-3">
          <AlertDialogHeader className="flex flex-row justify-between items-center space-y-0 px-6 pt-6 pb-0">
            <AlertDialogTitle className="text-xl font-bold">
              Customise Events and Modules
            </AlertDialogTitle>
            <AlertDialogCancel className="mt-0">Close</AlertDialogCancel>
          </AlertDialogHeader>

          <div className="overflow-auto max-h-[80vh]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-6">Loading...</p>
            ) : (
              <CustomiseShell events={events ?? []} modules={modules ?? []} />
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
