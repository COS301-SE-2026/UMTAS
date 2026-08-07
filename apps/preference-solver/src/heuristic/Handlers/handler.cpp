#include "handler.h"

Handler *createHandlerChain() {
  Handler *begin = new Handler("Start");

  begin->setNext(new TargetStartTimeHandler());

  return begin;
}
