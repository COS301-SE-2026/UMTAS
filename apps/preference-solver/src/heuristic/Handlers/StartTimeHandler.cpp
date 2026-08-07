#include "../Decorators/Decorators.h"
#include "handler.h"
#include "nlohmann/json.hpp"
#include <iostream>
BaseHeuristic *TargetStartTimeHandler::getHeuristic(nlohmann::json input) {

  json params = this->getParams(input);
  if (params != nullptr) {
    int targetTime = 0;

    if (params.contains(targetKey) && params[targetKey].is_number_integer()) {

      targetTime = params[targetKey].get<int>();
    }
    return new TargetStartTime(targetTime);

  } else
    return Handler::getHeuristic(input); // does the null check
}
