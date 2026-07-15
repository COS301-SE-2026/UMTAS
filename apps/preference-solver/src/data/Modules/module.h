#include "../../../lib/nlohmann/json.hpp"
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using nlohmann::json;
using std::cout;
using std::endl;
using std::string;
struct ModuleGA {
  static const string GROUPING_KEY;
  static const string MODULE_CODE_KEY;
  static const string OCCUR_ARRAY_KEY;
  static const string TYPE_KEY;
  static const string OCCUR_KEY;
  string moduleCode;
  // Required selections keyed by activityCode within this module.
  std::unordered_map<string, int> requiredSelections;
  ModuleGA(const json& module);
  static std::vector<ModuleGA> innitModules(const json &modulesArr);
  void handleActivityRequirements(const json& requirements);
};
#pragma once

