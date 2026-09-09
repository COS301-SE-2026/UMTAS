import { Button } from "@/components/atoms/baseShadcn/button";
import { useRouter } from "next/navigation";
export default function SetupVMSessionTemplate() {
  const router = useRouter();
  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full h-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Setup Lecture Watch Session
        </h1>
        <div className="w-full p-4">
          <Button
            onClick={() => {
              router.push("VisionModel/ID");
            }}
          >
            Create Session
          </Button>
        </div>
      </div>
    </div>
  );
}
