"use client";
import React, { useState } from "react";
import { ColourPicker } from "@/components/organisms/builder/colourPicker";

export default function temp() {
  const [selectedColour, setSelectedColour] = useState("#4A90F8");
  return (
    <div className="p-4">
      <ColourPicker
        value={selectedColour}
        onChange={(newColour) => setSelectedColour(newColour)}
      />
      <p className="mt-4">colour code: {selectedColour}</p>
    </div>
  );
}
