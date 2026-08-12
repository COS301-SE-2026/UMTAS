#include "../Decorators/Decorators.h"
#include "handler.h"
#include <iostream>
BaseHeuristic *SkipDayHandler::getHeuristic(nlohmann::json input) {

  json params = this->getParams(input);
  if (params != nullptr) {
    string day = "";

    if (params.contains(targetKey) && params[targetKey].is_string()) {
      day = params[targetKey].get<string>();
    }
    return new SkipDayDec(day);

  } else
    return Handler::getHeuristic(input); // does the null check
}

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

BaseHeuristic *SmallGapsHandler::getHeuristic(nlohmann::json input) {

  if (this->validKey(input)) {
    return new SmallGapsDec();
  } else {
    return Handler::getHeuristic(input); // does the null check
  }
}
