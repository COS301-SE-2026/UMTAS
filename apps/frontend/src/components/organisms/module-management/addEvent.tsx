"use client";
import {
  CreateEventBody,
  EventCriteria,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card } from "@/components/atoms/baseShadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { TIMES } from "@/components/atoms/builder/TimeSlotSelect";
import { InputProps, StateInput } from "@/components/atoms/utility/stateInput";
import { addUniEventMut } from "@/components/templates/builder/Queries/eventQueries";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface createEventProps {
  module: moduleDTO;
}

export default function CreateEventAdmin({ module }: createEventProps) {
  const [criteria, setCriteria] = useState<EventCriteria>({
    date: "",
    endTime: "",
    startTime: "",
    moduleId: module.moduleID,
    eventSource: "university",
  });
  const [event, setEvent] = useState<CreateEventBody>({
    eventName: "",
    activityCode: "",
    eventCriteria: criteria,
    isRecurring: false,
  });
  const { mutateAsync: addEvent } = useMutation(addUniEventMut());

  function updateEvent(field: keyof CreateEventBody, value: string) {
    setEvent({
      ...event,
      [field]: value,
    });
  }
  function updateCriteria(field: keyof EventCriteria, value: string) {
    setCriteria((prev) => {
      const updated = { ...prev, [field]: value };
      setEvent({
        ...event,
        eventCriteria: updated,
      });
      return updated;
    });
  }

  return (
    <Card className="pl-4 pr-20 w-fit h-fit m-auto">
      <h1>Create Event</h1>
      <StateInput State={event} field="eventName" update={updateEvent} />
      <StateInput State={event} field="activityCode" update={updateEvent} />
      <StateInput
        State={criteria}
        field="date"
        update={updateCriteria}
        type="date"
      />
      {/* <StateInput State={criteria} field="venue" update={updateCriteria} /> */}
      <div className="flex flex-row space-x-3">
        <TimeSelect
          times={TIMES}
          inputDetails={{
            State: criteria,
            field: "startTime",
            update: updateCriteria,
          }}
        />
        <TimeSelect
          times={TIMES}
          inputDetails={{
            State: criteria,
            field: "endTime",
            update: updateCriteria,
          }}
        />
      </div>
      <Button
        onClick={async () => {
          try {
            await addEvent({ body: event });
          } catch (err) {
            console.error(err);
          }
        }}
      >
        Create
      </Button>
    </Card>
  );
}
interface TimeSelectProps<EventCriteria> {
  times: string[];
  inputDetails: InputProps<EventCriteria>;
}
function TimeSelect<Type>({ times, inputDetails }: TimeSelectProps<Type>) {
  return (
    <Select
      value={String(inputDetails.State[inputDetails.field])}
      onValueChange={(val) => {
        inputDetails.update(inputDetails.field, val);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={String(inputDetails.field)}></SelectValue>
      </SelectTrigger>
      <SelectContent>
        {times.map((time, idx) => {
          return (
            <SelectItem key={idx} value={time}>
              {time}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
