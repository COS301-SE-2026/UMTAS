import { ReactNode } from "react";

interface popupProps {
  children?: ReactNode;
}

export default function Popup({ children }: popupProps) {
  return (
    <div className="fixed w-full inset-0 flex items-center justify-center bg-black/40 z-50">
      {children}
    </div>
  );
}
