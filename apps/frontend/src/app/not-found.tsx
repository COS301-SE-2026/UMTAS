import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <FileQuestion
        size={48}
        className="text-[--text-secondary] mb-6"
        aria-hidden
      />

      <h1 className="text-3xl font-semibold text-[--text-primary] mb-2">
        Page not found
      </h1>
      <p className="text-[--text-secondary] text-sm mb-8 max-w-xs">
        The page you're looking for doesn't exist.
      </p>

      <Button asChild>
        <Link href="/dashboard">Back to Home</Link>
      </Button>
    </div>
  );
}
