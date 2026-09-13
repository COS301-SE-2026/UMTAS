"use client";

import Tutorial from "@/components/organisms/nav/Tutorial";
import CalTemplate from "@/components/templates/calendar-management/caltemplate";

const steps = [
  {
    target: "#select-year",
    content: "Select the academic calendar year you want to manage.",
  },
  {
    target: "#include-public-holidays",
    content:
      "Choose whether public holidays should be included in this calendar.",
  },
  {
    target: "#create-restriction",
    content:
      "Create a new calendar restriction such as a recess, test week, or exam period.",
  },
  {
    target: "#calendar-restrictions",
    content:
      "View and manage the restrictions for the selected academic year here.",
  },
];

export default function CourseManagement() {
  return (
    <>
      <Tutorial steps={steps} wait={true} />

      <div className="overflow-y-hidden">
        <CalTemplate />
      </div>
    </>
  );
}
