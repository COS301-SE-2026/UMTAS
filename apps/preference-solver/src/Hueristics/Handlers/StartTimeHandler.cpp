#include "../Decorators/Decorators.h"
#include "handler.h"
#include "nlohmann/json.hpp"
BaseHeuristic *TargetStartTimeHandler::getHeuristic(nlohmann::json input) {

  json params = this->getParams(input);

  if (params) {
    int targetTime = 0;
    if (params.contains(targetKey) && params[targetKey].is_number_integer()) {
      targetTime = params[targetKey];
    }
    return new TargetStartTime(targetTime);

  } else
    return next->getHeuristic(input);
}
