"use client";
import React, { useState } from "react";
import { ColourPicker } from "@/components/organisms/builder/colourPicker";
import {
  EventTypeDropdown,
  EventType,
} from "@/components/organisms/builder/eventDropdown";

export default function temp() {
  const [selectedColour, setSelectedColour] = useState("#4A90F8");
  const [selectedEvent, setSelectedEvent] = useState<EventType>("lecture");
  return (
    <div>
      <div className="p-4">
        <ColourPicker
          value={selectedColour}
          onChange={(newColour) => setSelectedColour(newColour)}
        />
        <p className="mt-4">colour code: {selectedColour}</p>
      </div>

      <EventTypeDropdown
        value={selectedEvent}
        onChange={(newEvent) => setSelectedEvent(newEvent)}
      />
    </div>
  );
}
