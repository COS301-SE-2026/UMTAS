export interface ErrorPayload {
  debugError: string; //actual error
  userMessage: string; //message we send the users
}

export const errorName = "app:error";

//this function gets called whenever an error is thrown

export const throwError = (payload: ErrorPayload) => {
  const err = new CustomEvent<ErrorPayload>(errorName, { detail: payload });
  window.dispatchEvent(err);
};
