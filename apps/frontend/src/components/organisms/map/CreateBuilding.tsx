"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Input } from "@/components/atoms/baseShadcn/input";
import { Label } from "@/components/atoms/baseShadcn/label";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/atoms/baseShadcn/dialog";

import { createBuildingMut } from "../../../../utilities/building/buildingQueries";

export function CreateBuilding() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [colour, setColour] = useState("blue");
  const [open, setOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  const { mutate, isPending } = useMutation(createBuildingMut());

  function reset() {
    setName("");
    setIcon("");
    setColour("blue");
    setDuplicateError(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setDuplicateError(false);

    mutate(
      {
        body: {
          buildingName: name,
          icon: icon || null,
          displayColour: colour,
        },
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
        onError: (error) => {
          //building with same name exists vro
          if ((error as { status?: number })?.status === 409) {
            setDuplicateError(true);
          }
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <Plus size={14} strokeWidth={1} />
          New Building
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a building</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="building-name">Building name</Label>
            <Input
              id="building-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setDuplicateError(false);
              }}
              placeholder="e.g. Thuto"
              required={true}
              maxLength={100}
            />
            {duplicateError && (
              <p className="text-sm text-[var(--error-text)]">
                A building named &quot;{name}&quot; already exists.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="building-icon">Icon (optional)</Label>
            <Input
              id="building-icon"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="e.g. icon"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="building-colour">Display colour</Label>
            {/* This will be changed to the colour picker component (but expanded to have more colours) that I have created */}
            <Input
              id="building-colour"
              type="color"
              value={colour}
              onChange={(event) => setColour(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating" : "Create Building"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
