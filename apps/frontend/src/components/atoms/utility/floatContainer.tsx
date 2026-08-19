import { ReactNode, MouseEvent } from "react";

interface popupProps {
  children?: ReactNode;
  onClose?: () => void;
}

export default function Popup({ children, onClose }: popupProps) {
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
    >
      {children}
    </div>
  );
}
