"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Inbox } from "lucide-react";
import {
  ModuleCard,
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
import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";

interface ModulesStepProps {
  modules: ModuleResponseDto[];
  onAdd: () => void;
  onUpdate: (
    id: number,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID"> | "confirm",
    value: string,
  ) => void | Promise<void>;
  onRemove: (id: number) => void;
  onNavigateAway: () => void;
}

function validateModule(module: ModuleResponseDto) {
  const errors: ModuleErrors = {};
  let hasErrors = false;

  if (!module.moduleCode.trim()) {
    errors.moduleCode = "Code is required";
    hasErrors = true;
  }
  if (!module.moduleName.trim()) {
    errors.moduleName = "Name is required";
    hasErrors = true;
  }
  if (!module.styling) {
    errors.styling = "Colour is required";
    hasErrors = true;
  }

  return { errors, hasErrors };
}

function isModuleComplete(module: ModuleResponseDto) {
  return !!(module.moduleCode && module.moduleName && module.styling);
}

export function ModulesStep({
  modules,
  onAdd,
  onUpdate,
  onRemove,
  onNavigateAway,
}: ModulesStepProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMap, setErrorMap] = useState<Record<number, ModuleErrors>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [snapshot, setSnapshot] = useState<ModuleResponseDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
      onUpdate(snapshot.moduleID, "moduleCode", snapshot.moduleCode);
      onUpdate(snapshot.moduleID, "moduleName", snapshot.moduleName);
      onUpdate(snapshot.moduleID, "styling", snapshot.styling || "");
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

  function handleSelect(id: number) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    function doSelect() {
      const selected = modules.find((m) => m.moduleID === id);
      if (selected) {
        setSnapshot({ ...selected });
      }
      setSelectedId(id);
      setIsDirty(false);
    }

    requestNavigation(doSelect);
  }

  async function handleConfirm(id: number) {
    if (isConfirming) return;
    const lectureModule = modules.find((m) => m.moduleID === id);
    if (!lectureModule) return;

    const { errors: validationErrors, hasErrors } =
      validateModule(lectureModule);
    if (hasErrors) {
      setErrorMap((prev) => ({ ...prev, [id]: validationErrors }));
      return;
    }

    setIsConfirming(true);
    try {
      await onUpdate(id, "confirm", "");
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setIsDirty(false);
      setSnapshot(null);
      setSelectedId(null);
    } catch (error) {
      console.error("Failed to confirm module:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  function handleAdd() {
    if (isAdding) return;

    function doAdd() {
      setIsAdding(true);
      onAdd();
      setTimeout(() => setIsAdding(false), 2000);
      setIsDirty(false);
      setSnapshot(null);
    }
    requestNavigation(doAdd);
  }

  function handleRemove(id: number) {
    if (isDeleting) return;

    if (selectedId === id) {
      setSelectedId(null);
      setIsDirty(false);
      setSnapshot(null);
    }

    setIsDeleting(true);
    onRemove(id);
    setTimeout(() => setIsDeleting(false), 2000);

    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleUpdate(
    id: number,
    field: keyof Omit<ModuleResponseDto, "moduleID" | "userID">,
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

  function renderModuleRow(module: ModuleResponseDto, index: number) {
    const isComplete = isModuleComplete(module);
    const isSelected = selectedId === module.moduleID;
    const errors = errorMap[module.moduleID];

    return (
      <div key={module.moduleID} className="flex flex-col gap-2">
        {/* summary row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect(module.moduleID)}
            className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: module.styling || "var(--border)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-[var(--text-primary)] truncate">
                {module.moduleName || "Module " + (index + 1)}
              </p>
              {module.moduleCode && (
                <p className="text-sm font-mono text-[var(--text-secondary)]">
                  {module.moduleCode}
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
            onClick={() => handleRemove(module.moduleID)}
            disabled={isDeleting}
            aria-label={"Remove module " + (index + 1)}
            className="h-10 w-10 flex-shrink-0 border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--error-text)] hover:text-[var(--error-text)] hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => handleConfirm(module.moduleID)}
              disabled={isConfirming}
              aria-label="Confirm module"
              className="w-full gap-2 border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} strokeWidth={1.5} />
              {isConfirming ? "Confirming..." : "Confirm"}
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
        disabled={isAdding}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--border)] px-4 py-4 text-left text-base text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
          <Plus size={16} strokeWidth={1.5} />
        </span>
        {isAdding ? "Adding..." : "Add module"}
      </button>
    </div>
  );
}
