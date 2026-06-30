import { ChooseInstituteTemplate } from "@/components/templates/choose-institute/chooseInstituteTemplate";

export default async function ChooseInstitutePage() {
  return (
    <div className="flex flex-col gap-4">
      <ChooseInstituteTemplate passedrole="student" />
    </div>
  );
}
