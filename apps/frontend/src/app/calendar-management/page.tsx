"use client";

import Tutorial from "@/components/organisms/nav/Tutorial";
import CalTemplate from "@/components/templates/calendar-management/caltemplate";

const steps = [
  {
    target: "#calendar-management",
    content:
      "Manage your university's academic calendars, public holidays, and calendar restrictions here.",
  },
  {
    target: "#select-calendar-year",
    content:
      "Select the academic year you want to manage. A calendar will be created automatically if one does not already exist.",
  },
  {
    target: "#include-public-holidays",
    content:
      "Choose whether the public holiday calendar should be included for the selected academic year.",
  },
  {
    target: "#create-restriction",
    content:
      "Create a new calendar restriction and choose its type, such as a semester period, recess, test week, or exam period.",
  },
  {
    target: "#calendar-restrictions",
    content:
      "View and manage all restrictions for the selected academic year here.",
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
