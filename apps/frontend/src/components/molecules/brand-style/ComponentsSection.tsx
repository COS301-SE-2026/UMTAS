"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/baseShadcn/avatar";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import { Input } from "@/components/atoms/baseShadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Label } from "@/components/atoms/baseShadcn/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/atoms/baseShadcn/sheet";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Slider } from "@/components/atoms/baseShadcn/slider";
import { Toaster } from "@/components/atoms/baseShadcn/sonner";
import { Switch } from "@/components/atoms/baseShadcn/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/baseShadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/baseShadcn/tabs";
import { Textarea } from "@/components/atoms/baseShadcn/textarea";
import { Toggle } from "@/components/atoms/baseShadcn/toggle";
import { ColourPicker } from "@/components/atoms/builder/colourPicker";
import { ScheduleView } from "@/components/organisms/viewTimetable/ScheduleView";
import { WeeklyGrid } from "@/components/organisms/viewTimetable/WeeklyGrid";
import type { ScheduleEvent } from "@/types/schedule";

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: "id-1",
    name: "Software Engineering",
    code: "COS301",
    date: "2026-07-13",
    startTime: "08:00",
    endTime: "09:30",
    isRecurring: true,
    accentColour: null,
    subLabel: "IT 2-26",
  },
  {
    id: "id-2",
    name: "Networks",
    code: "COS332",
    date: "2026-07-13",
    startTime: "10:30",
    endTime: "11:30",
    isRecurring: true,
    accentColour: null,
    subLabel: "IT 2-27",
  },
  {
    id: "id-3",
    name: "Programming languages",
    code: "COS333",
    date: "2026-07-14",
    startTime: "14:00",
    endTime: "17:00",
    isRecurring: true,
    accentColour: null,
    subLabel: "IT 2-28",
  },
  {
    id: "id-4",
    name: "Artificial Intelligence",
    code: "COS314",
    date: "2026-07-15",
    startTime: "09:00",
    endTime: "10:30",
    isRecurring: true,
    accentColour: null,
    subLabel: "IT 2-28",
  },
  {
    id: "id-5",
    name: "Joint Community Project",
    code: "JCP123",
    date: "2026-07-16",
    startTime: "11:30",
    endTime: "12:30",
    isRecurring: true,
    accentColour: null,
    subLabel: "IT 2-29",
  },
];

export function ComponentSection() {
  return (
    <div className="w-full mt-8 mb-8">
      <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
        Components Section
      </h1>
      <section className="space-y-4 border p-4 rounded-xl mb-8">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex gap-4">
          <Button variant="default">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>
      <section className="space-y-4 border p-4 rounded-xl mb-8">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="" alt="alt text bro" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>

          <Badge variant="default">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="space-y-4 border p-4 rounded-xl mb-8">
        <h2 className="text-lg font-semibold">Forms and Input</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="basic-input">Text Input</Label>
            <Input id="basic-input" placeholder="Type something here..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropdown">Select Menu</Label>
            <Select>
              <SelectTrigger id="dropdown">
                <SelectValue placeholder="Select option please" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opt1">Option 1</SelectItem>
                <SelectItem value="opt2">Option 2</SelectItem>
                <SelectItem value="opt3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <Label htmlFor="textarea-input">Textarea</Label>
          <Textarea
            id="textarea-input"
            placeholder="Enter a longer description.."
          />
        </div>

        <div className="flex  gap-6 pt-4">
          <div className="flex  space-x-2">
            <Checkbox id="checkbox-demo" />
            <Label htmlFor="checkbox-demo">Check me</Label>
          </div>
          <div className="flex  space-x-2">
            <Switch id="switch-demo" />
            <Label htmlFor="switch-demo">Toggle me</Label>
          </div>
          <div className="flex  space-x-2">
            <Toggle aria-label="Toggle state">Press me</Toggle>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <Label>Slider Input</Label>
          <Slider defaultValue={[50]} max={100} step={5} />
        </div>
      </section>

      <section className="space-y-4 border p-4 rounded-xl mb-8">
        <h2 className="text-lg font-semibold">Layouts and Overlays</h2>

        <div className="flex items-start gap-6">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                A brief description of the card content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Main content comes here</p>
              <p className="text-sm text-muted-foreground">
                Additional text area
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button size="sm">Submit</Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Click to open menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary">Slide from side</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Side Panel</SheetTitle>
                    <SheetDescription>
                      This is a slide out overlay for additional details or
                      configuration.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 border p-4 rounded-xl mb-8">
        <h2 className="text-lg font-semibold">Data Tables and Tabs</h2>

        <Tabs defaultValue="tab1" className="w-full">
          <TabsList>
            <TabsTrigger value="tab1">First View</TabsTrigger>
            <TabsTrigger value="tab2">Second View</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Module</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">L1</TableCell>
                  <TableCell>Lecture</TableCell>
                  <TableCell>COS 301</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">L2</TableCell>
                  <TableCell>Practical</TableCell>
                  <TableCell>COS332</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm text-muted-foreground pt-4">
              This view is leeg man.
            </p>
          </TabsContent>
        </Tabs>
      </section>
      <section className="space-y-4 mb-8 mt-8">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Domain Specific</h2>
          <Card className="p-4">
            Colour Picker
            <ColourPicker value="alt text" onChange={() => {}} />
          </Card>
          <h2 className="text-md font-semibold">Weekly Grid</h2>
          <WeeklyGrid events={mockScheduleEvents} weekStart={new Date()} />
        </Card>
      </section>

      <Toaster />
    </div>
  );
}
