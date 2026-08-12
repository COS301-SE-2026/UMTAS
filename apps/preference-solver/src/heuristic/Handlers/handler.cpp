#include "handler.h"

Handler *createHandlerChain() {
  Handler *begin = new Handler("Start");
  begin->setNext(new TargetStartTimeHandler());
  begin->setNext(new SkipDayHandler());
  begin->setNext(new SmallGapsHandler());

  return begin;
}

json Handler::getParams(json input) {
  if (input.contains("key") && input["key"].is_string() &&
      input["key"].get<string>() == key && input.contains(paramKey) &&
      input[paramKey].is_object()) {

    return input[paramKey].get<json>();
  } else
    return nullptr;
};
