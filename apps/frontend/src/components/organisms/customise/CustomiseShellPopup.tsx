"use client";
import CustomiseShell from "@/components/templates/customise/CustomiseShell";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/baseShadcn/dialog";

import { useQuery } from "@tanstack/react-query";
import { getAllModulesQ } from "@/components/templates/builder/Queries/moduleQueries";
import { getAllEventsQ } from "@/components/templates/builder/Queries/eventQueries";
import { SquarePen } from "lucide-react";

export default function CustomiseShellPopup() {
  const { data: modules, isLoading: modulesLoading } =
    useQuery(getAllModulesQ());
  const { data: events, isLoading: eventsLoading } = useQuery(getAllEventsQ());

  const isLoading = modulesLoading || eventsLoading;

  return (
    <div className="">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            id="btn-customise-schedule"
            variant="secondary"
            className="h-8 px-3 text-xs hover:opacity-90 cursor-pointer border border-1 border-(--bg-surface)"
          >
            <SquarePen />
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[768px] max-w-[95vw] sm:max-w-[768px] p-0 flex flex-col gap-3 bg-(--bg-surface)">
          <DialogHeader className="flex flex-row justify-between items-center space-y-0 px-6 pt-6 pb-0">
            <DialogTitle className="text-xl font-bold">
              Customise Events and Modules
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto max-h-[80vh]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-6">Loading...</p>
            ) : (
              <CustomiseShell events={events ?? []} modules={modules ?? []} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
