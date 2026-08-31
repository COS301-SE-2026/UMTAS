import { useEffect } from "react";
import { toast } from "sonner";
import { errorName, type ErrorPayload } from "../../utilities/errorCries";

export const useErrorListener = () => {
  useEffect(() => {
    const globalErrorHandler = (event: Event) => {
      const CustomEvent = event as CustomEvent<ErrorPayload>;
      const { debugError, userMessage } = CustomEvent.detail;

      if (debugError) console.error(`[Error man]: ${debugError}`);

      //the actual UI that gets rendered once the error is emitted by errorCries.ts
      toast.error(userMessage);
    };

    //site listens for this
    window.addEventListener(errorName, globalErrorHandler);

    //site stops listening for this
    return () => window.removeEventListener(errorName, globalErrorHandler);
  }, []);
};
