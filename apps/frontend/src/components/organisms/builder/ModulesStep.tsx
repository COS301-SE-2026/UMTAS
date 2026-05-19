"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Inbox } from "lucide-react";
import {
  ModuleCard,
  type Module,
  type ModuleErrors,
} from "@/components/molecules/builder/ModuleCard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/atoms/baseShadcn/alert-dialog";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Card, CardContent } from "@/components/atoms/baseShadcn/card";

interface ModulesStepProps {
  modules: Module[];
  onAdd: () => void;
  onUpdate: (
    id: string,
    field: keyof Omit<Module, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
  onNavigateAway: () => void;
}

function validateModule(module: Module) {
  const errors: ModuleErrors = {};
  let hasErrors = false;

  if (!module.code.trim()) {
    errors.code = "Code is required";
    hasErrors = true;
  }
  if (!module.name.trim()) {
    errors.name = "Name is required";
    hasErrors = true;
  }
  if (!module.colour) {
    errors.colour = "Colour is required";
    hasErrors = true;
  }

  return { errors, hasErrors };
}

function isModuleComplete(module: Module) {
  return !!(module.code && module.name && module.colour);
}

export function ModulesStep({
  modules,
  onAdd,
  onUpdate,
  onRemove,
  onNavigateAway,
}: ModulesStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, ModuleErrors>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [snapshot, setSnapshot] = useState<Module | null>(null);

  function requestNavigation(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action);
      setShowGuard(true);
      return;
    }
    action();
  }

  function handleGuardConfirm() {
    if (snapshot) {
      onUpdate(snapshot.id, "code", snapshot.code);
      onUpdate(snapshot.id, "name", snapshot.name);
      onUpdate(snapshot.id, "colour", snapshot.colour);
    }
    setIsDirty(false);
    setShowGuard(false);
    setSnapshot(null);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  function handleGuardCancel() {
    setShowGuard(false);
    setPendingAction(null);
  }

  function handleSelect(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    function doSelect() {
      const selected = modules.find((m) => m.id === id);
      if (selected) {
        setSnapshot({ ...selected });
      }
      setSelectedId(id);
      setIsDirty(false);
    }

    requestNavigation(doSelect);
  }

  function handleConfirm(id: string) {
    const lectureModule = modules.find((m) => m.id === id);
    if (!lectureModule) return;

    const { errors: validationErrors, hasErrors } =
      validateModule(lectureModule);
    if (hasErrors) {
      setErrorMap((prev) => ({ ...prev, [id]: validationErrors }));
      return;
    }

    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setIsDirty(false);
    setSnapshot(null);
    setSelectedId(null);
  }

  function handleAdd() {
    function doAdd() {
      onAdd();
      setIsDirty(false);
      setSnapshot(null);
    }
    requestNavigation(doAdd);
  }

  function handleRemove(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setIsDirty(false);
      setSnapshot(null);
    }
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onRemove(id);
  }

  function handleUpdate(
    id: string,
    field: keyof Omit<Module, "id">,
    value: string,
  ) {
    setIsDirty(true);
    onUpdate(id, field, value);
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
          <Inbox size={20} strokeWidth={1.5} />
        </div>
        <p className="text-base text-[var(--text-secondary)]">No modules yet</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Add a module below to start
        </p>
      </div>
    );
  }

  function renderModuleRow(module: Module, index: number) {
    const isComplete = isModuleComplete(module);
    const isSelected = selectedId === module.id;
    const errors = errorMap[module.id];

    return (
      <div key={module.id} className="flex flex-col gap-2">
        {/* summary row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect(module.id)}
            className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: module.colour || "var(--border)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-[var(--text-primary)] truncate">
                {module.name || "Module " + (index + 1)}
              </p>
              {module.code && (
                <p className="text-sm font-mono text-[var(--text-secondary)]">
                  {module.code}
                </p>
              )}
            </div>
            {isComplete && !isSelected && (
              <CheckCircle
                size={16}
                className="text-[var(--text-secondary)] flex-shrink-0"
                strokeWidth={1.5}
              />
            )}
          </button>

          {/* trash button on summary row*/}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(module.id)}
            aria-label={"Remove module " + (index + 1)}
            className="h-10 w-10 flex-shrink-0 border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--error-text)] hover:text-[var(--error-text)] hover:bg-transparent"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </Button>
        </div>

        {/* inline edit form */}
        {isSelected && (
          <div className="flex flex-col gap-2 pl-2">
            <ModuleCard
              module={module}
              index={index}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              errors={errors}
            />
            {/* confirm button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleConfirm(module.id)}
              aria-label="Confirm module"
              className="w-full gap-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)]"
            >
              <CheckCircle size={16} strokeWidth={1.5} />
              Confirm
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <AlertDialog open={showGuard} onOpenChange={setShowGuard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you continue, they will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleGuardCancel}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGuardConfirm}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Modules
        </h2>
        <p className="text-base text-[var(--text-secondary)] mt-1">
          {modules.length === 0
            ? "Add the modules you want to schedule."
            : modules.length +
              " module" +
              (modules.length !== 1 ? "s" : "") +
              " added."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {modules.length === 0 && renderEmptyState()}
        {modules.map((module, index) => renderModuleRow(module, index))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--border)] px-4 py-4 text-left text-base text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
          <Plus size={16} strokeWidth={1.5} />
        </span>
        Add module
      </button>
    </div>
  );
}
