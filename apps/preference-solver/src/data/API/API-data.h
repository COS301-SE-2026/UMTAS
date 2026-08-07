#include "../../../lib/nlohmann/json.hpp"
#include "../Events/event.h"
#include "../Modules/module.h"
#include <iostream>
#include <string>
#include <vector>
class BaseHeuristic;
using std::cout;
using std::endl;
using std::string;
using json = nlohmann::json;
struct API_DATA {
  API_DATA(const json &reqData);
  API_DATA() {};
  std::vector<ModuleGA> modules;
  std::vector<EventGA> events;
  BaseHeuristic *decorators;
};
#pragma once
