import type { Metadata } from "next";
import { ConnectedAccountsPanel } from "@/components/organisms/account/ConnectedAccountsPanel";
import { DeleteAccountPanel } from "@/components/organisms/account/DeleteAccountPanel";

export const metadata: Metadata = {
  title: "Account settings",
};

export default function AccountPage() {
  return (
    <div className="max-w-[1280px] mx-auto py-12 px-6 md:px-8">
      <h1 className="mb-8 text-[24px] font-semibold leading-[1.3] text-[var(--text-primary)]">
        Account settings
      </h1>
      <div className="max-w-3xl space-y-8">
        <ConnectedAccountsPanel />
        <DeleteAccountPanel />
      </div>
    </div>
  );
}
