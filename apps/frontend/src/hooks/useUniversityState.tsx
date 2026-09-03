"use client";

import { getAllUni } from "@/app/choose-institute/queries/UserRoleQueries";
import { uniDto } from "@/app/choose-institute/queries/builders";
import { UserDetails } from "@/lib/userclass/userClass";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface UniversityState {
  university: uniDto | undefined;
  isLoading: boolean;
  requiresSelection: boolean;
}

const UniversityStateContext = createContext<UniversityState | undefined>(
  undefined,
);

export function UniversityStateProvider({ children }: { children: ReactNode }) {
  const [university, setUniversity] = useState<uniDto>();
  const [hasHydrated, setHasHydrated] = useState(false);
  // Set while we clear a stored university that no longer exists. Clearing
  // fires UserDetails.changeEvent, and the handler below would otherwise reset
  // `university` to undefined -- which flips `requiresSelection` back to false
  // and drops the selection gate. Keeping the stale value in state is what
  // holds the gate open; the flag is cleared once a valid university is stored.
  const isClearingInvalidUniversity = useRef(false);

  useEffect(() => {
    const readStoredUniversity = () => {
      const storedUniversity = UserDetails.getUniDetails();
      if (storedUniversity) {
        isClearingInvalidUniversity.current = false;
        setUniversity(storedUniversity);
      } else if (!isClearingInvalidUniversity.current) {
        setUniversity(undefined);
      }
      setHasHydrated(true);
    };

    readStoredUniversity();
    window.addEventListener(UserDetails.changeEvent, readStoredUniversity);
    window.addEventListener("storage", readStoredUniversity);

    return () => {
      window.removeEventListener(UserDetails.changeEvent, readStoredUniversity);
      window.removeEventListener("storage", readStoredUniversity);
    };
  }, []);

  const universitiesQuery = useQuery({
    ...getAllUni(),
    enabled: hasHydrated && university != null,
  });

  const storedUniversityExists =
    !university ||
    !universitiesQuery.isSuccess ||
    universitiesQuery.data.universities.some(
      (candidate) => candidate.UniversityID === university.UniversityID,
    );

  useEffect(() => {
    if (!university || !universitiesQuery.isSuccess) return;
    if (!storedUniversityExists) {
      isClearingInvalidUniversity.current = true;
      UserDetails.clearUniDetails();
    }
  }, [storedUniversityExists, university, universitiesQuery.isSuccess]);

  const value = useMemo(
    () => ({
      university: storedUniversityExists ? university : undefined,
      requiresSelection:
        university != null &&
        universitiesQuery.isSuccess &&
        !storedUniversityExists,
      isLoading:
        !hasHydrated || (university != null && universitiesQuery.isPending),
    }),
    [
      hasHydrated,
      storedUniversityExists,
      university,
      universitiesQuery.isSuccess,
      universitiesQuery.isPending,
    ],
  );

  return (
    <UniversityStateContext.Provider value={value}>
      {children}
    </UniversityStateContext.Provider>
  );
}

export function useUniversityState() {
  const state = useContext(UniversityStateContext);
  if (!state) {
    throw new Error(
      "useUniversityState must be used within UniversityStateProvider",
    );
  }
  return state;
}

export function UniversityStateLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center py-20 text-[var(--text-secondary)]">
      Loading university
    </div>
  );
}
