"use client";

import React, { useState, useCallback, JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApprovalStatus } from "@/components/molecules/choose-institute/ApprovalStatus";
import { SelectInstituteField } from "@/components/molecules/choose-institute/SelectInstituteField";
import { SelectRoleField } from "@/components/molecules/choose-institute/SelectRoleField";

interface InstituteSelectorProps {
  onInstituteSelected: (instituteId: string, role: string) => void;
  passedrole?: string; //will probably need to change as well, just waiting for willie
}

export const InstituteSelector: React.FC<InstituteSelectorProps> = ({
  passedrole,
  onInstituteSelected,
}) => {
  //mock for now, will be replaced with actual data from the backend when we link it up
  const institutes = [
    { id: "1", name: "University of Cape Town" },
    { id: "2", name: "Stellenbosch University" },
  ];
  const roles = "Student"; //will change with dto

  const handleNotSupported = () => {};
  const handleInstituteChange = (instituteId: string) => {
    setSelectedInstitute(instituteId);
  };
  const [selectedInstitute, setSelectedInstitute] = useState("");

  const [selectedRole, setSelectedRole] = useState(passedrole || "");
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const [approvalStatus, setApprovalStatus] = useState<
    "approved" | "pending" | "rejected" | null
  >(null);

  return (
    <div className="flex flex-col gap-6">
      <SelectInstituteField
        institutes={institutes}
        value={selectedInstitute}
        onChange={handleInstituteChange}
        onNotSupportedClick={handleNotSupported}
      />
      <SelectRoleField value={selectedRole} onChange={handleRoleChange} />
      <ApprovalStatus
        status={approvalStatus}
        universityName="University of Pretoria"
      />
    </div>
  );
};
