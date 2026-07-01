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
    <div className="p-8">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Customise Modules and Events</Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="w-max max-w-[95vw] p-6">
          <AlertDialogHeader className="flex flex-row justify-between items-center border-b pb-2">
            <AlertDialogTitle className="text-xl font-bold">
              Customise your Events and Modules
            </AlertDialogTitle>
            <AlertDialogCancel className="mt-0">Close</AlertDialogCancel>
          </AlertDialogHeader>

          <div className="py-4 overflow-auto max-h-[80vh]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <CustomiseShell events={events ?? []} modules={modules ?? []} />
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
