import { ChooseInstituteTemplate } from "@/components/templates/choose-institute/chooseInstituteTemplate";

export default async function ChooseInstitutePage() {
  return (
    <div className="w-full justify-center flex h-full">
      <div className="w-1/2 flex flex-col gap-4">
        <ChooseInstituteTemplate />
      </div>
    </div>
  );
}
