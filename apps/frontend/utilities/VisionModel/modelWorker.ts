import { DETECT_MESSAGE } from "./messageTypes";

self.onmessage = (event: MessageEvent) => {
  const message = event.data as DETECT_MESSAGE;

  if (message.eventType === "DETECT") {
  }
};
