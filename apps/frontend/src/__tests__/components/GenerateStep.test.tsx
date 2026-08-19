import React from "react";
import { render, screen } from "@testing-library/react";
import { GenerateStep } from "@/components/organisms/builder/GenerateStep";

describe("GenerateStep props testing", () => {
  it("change name for button when edit is enabled", () => {
    render(
      <GenerateStep
        onGenerate={jest.fn()}
        isGenerating={false}
        isEditMode={true}
        timetableName="Timetable"
        setTimetableName={jest.fn()}
        selectedEventIds={[""]}
        setSelectedEventIds={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /edit schedule/i }),
    ).toBeInTheDocument();
  });
});
