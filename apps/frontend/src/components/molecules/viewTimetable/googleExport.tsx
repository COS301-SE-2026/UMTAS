import { GoogleIcon } from "@/components/atoms/auth/GoogleIcon";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Separator } from "@/components/atoms/baseShadcn/separator";
import Popup from "@/components/atoms/utility/floatContainer";
import { useState } from "react";
interface googleListType {
  name: string;
  googleID: string;
}
export default function GooglePopup() {
  const [signedIn, setSignedIn] = useState(false);

  /**
   * @todo Mikal heres where you store google details you need please define a type or interface for type safety
   */
  const [googleDetails, setGoogleDetails] = useState({});

  if (signedIn)
    return (
      <Card className="flex  lg:px-2 items-center capitalize  w-1/4  ">
        <CardTitle className="text-left w-full p-2">
          Export to google Calendar
        </CardTitle>
        <CardContent className="w-full  items-center  ">
          <div className="flex flex-col w-full gap-y-4  justify-center text-center ">
            <GoogleList />
            <div className="flex items-center w-full gap-4">
              <Separator className="flex-1" />
              <span className="">OR</span>
              <Separator className="flex-1" />
            </div>
            <GoogleAddSchedule />
          </div>
        </CardContent>
      </Card>
    );
  else {
    return (
      <Card className="flex  lg:px-2 items-center capitalize  w-1/4 h-1/3  ">
        <CardTitle className="text-left w-full p-2">
          Export to google Calendar
        </CardTitle>
        <CardContent className="w-full h-full flex flex-col justify-center items-center">
          <Button
            className="w-50"
            onClick={() => {
              setSignedIn(true);
            }}
          >
            <GoogleIcon></GoogleIcon> Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }
}

export function GoogleList() {
  const [googleSchedules, setGoogleSchedules] = useState<googleListType[]>([
    { name: "TT1", googleID: "id1" },
    { name: "TT2", googleID: "id2" },
    { name: "TT3", googleID: "id3" },
  ]);
  const [selectedSchedule, setSelectedSchedule] = useState<googleListType>(
    googleSchedules[0],
  );

  return (
    <div className="grid grid-cols-1  justify-center gap-y-4   items-center w-full ">
      <Label className="text-sm font-medium text-left w-full gap-y-2  text-[var(--text-secondary)] grid grid-cols-1">
        Select Schedule
        <Select
          disabled={false}
          value={selectedSchedule.googleID}
          onValueChange={async (e) => {
            const schedule = googleSchedules.find(
              (schedule) => schedule.googleID === e,
            );
            if (schedule) {
              setSelectedSchedule(schedule);
            }
          }}
        >
          <SelectTrigger
            id="select-year"
            className="capitalize w-50 bg-primary text-secondary"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {googleSchedules.map((timetable, idx) => (
              <SelectItem key={idx} value={timetable.googleID}>
                {timetable.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>

      <Label className="text-sm font-medium text-left w-full gap-y-2   text-[var(--text-secondary)] grid grid-cols-1">
        Confirm
        <Button className="w-50" onClick={() => {}}>
          <GoogleIcon></GoogleIcon> Add to Google Calendar
        </Button>
      </Label>
    </div>
  );
}

export function GoogleAddSchedule() {
  const [scheduleName, setScheduleName] = useState<string>("");

  return (
    <div className="grid grid-cols-1  justify-center gap-y-4   items-center w-full">
      <Label className="text-sm font-medium text-left w-full gap-y-2  text-[var(--text-secondary)] flex flex-col">
        Select Schedule
        <Input
          data-testid="restriction-Date-Input"
          type="text"
          placeholder="Schedule Name..."
          value={scheduleName}
          onChange={(e) => {
            setScheduleName(e.target.value);
          }}
          className="h-8 w-50 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </Label>

      <Label className="text-sm font-medium text-left w-full gap-y-2   text-[var(--text-secondary)] flex flex-col">
        Confirm
        <Button className="w-50" onClick={() => {}}>
          <GoogleIcon></GoogleIcon> Add to Google Calendar
        </Button>
      </Label>
    </div>
  );
}
