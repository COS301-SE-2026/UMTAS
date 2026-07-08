"use client";
import {
  CreateEventBody,
  EventCriteria,
} from "@/app/builder/utils/events/eventRequestBuilder";
import { moduleDTO } from "@/app/course-management/queries/modules/moduleBuilder";
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
import { InputType } from "node:zlib";
import { useState } from "react";

interface createEventProps {
  module: moduleDTO;
}

export default function CreateEventAdmin({ module }: createEventProps) {
  const [criteria, setCriteria] = useState<EventCriteria>({
    date: "",
    endTime: "",
    venue: "",
    startTime: "",
    moduleID: module.moduleID,
    type: "university",
  });
  const [event, setEvent] = useState<CreateEventBody>({
    eventName: "",
    eventCode: "",
    eventCriteria: criteria,
    isRecurring: false,
  });

  function updateEvent(field: keyof CreateEventBody, value: string) {
    setEvent({
      ...event,
      [field]: value,
    });
  }
  function updateCriteria(field: keyof EventCriteria, value: string) {
    setCriteria({
      ...criteria,
      [field]: value,
    });
  }

  return (
    <Card>
      <StateInput State={event} field="eventName" update={updateEvent} />
      <StateInput State={event} field="eventCode" update={updateEvent} />
      <StateInput
        State={criteria}
        field="date"
        update={updateCriteria}
        type="date"
      />
      <StateInput State={criteria} field="venue" update={updateCriteria} />
      <div className="flex flex-row">
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
        <SelectValue placeholder="Time"></SelectValue>
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
