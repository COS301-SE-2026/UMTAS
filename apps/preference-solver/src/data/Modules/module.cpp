#include "module.h"
#include "nlohmann/json.hpp"
#include <stdexcept>
#include <string>
#include <vector>

const string ModuleGA::GROUPING_KEY = "modules";
const string ModuleGA::MODULE_CODE_KEY = "moduleCode";
const string ModuleGA::OCCUR_ARRAY_KEY = "activityRequirements";
const string ModuleGA::TYPE_KEY = "activityCode";
const string ModuleGA::OCCUR_KEY = "requiredSelections";
/*
 activityRequirements: [
 {
    activityCode: string
    requiredSelections: int
 }
 ]
 */

ModuleGA::ModuleGA(const json& module) {
  if (module.contains(MODULE_CODE_KEY) && module[MODULE_CODE_KEY].is_string()) {
    this->moduleCode = module[MODULE_CODE_KEY].get<string>();
  } else {
    throw std::runtime_error(MODULE_CODE_KEY +
                             "is not defined or is not a string");
  }

  if (module.contains(OCCUR_ARRAY_KEY) && module[OCCUR_ARRAY_KEY].is_array()) {
    this->handleActivityRequirements(module[OCCUR_ARRAY_KEY]);
  } else {
    throw std::runtime_error(
        OCCUR_ARRAY_KEY + "is not defined or is not an array of json objects");
  }
}

std::vector<ModuleGA> ModuleGA::innitModules(const json &modulesArr) {
  std::vector<ModuleGA> retModules;

  if (modulesArr.is_array()) {
    for (auto &module : modulesArr) {
      retModules.push_back(ModuleGA(module));
    }
    return retModules;
  } else {
    throw std::runtime_error("key:" + GROUPING_KEY +
                             " Is not an array init Modules");
  }
}

void ModuleGA::handleActivityRequirements(const json& requirements) {
  // Build the requirement count for each activity code.

  for (auto &obj : requirements) {
    string activityCode;
    int selections;
    if (obj.contains(TYPE_KEY) && obj[TYPE_KEY].is_string())
      activityCode = obj[TYPE_KEY].get<string>();
    else
      throw std::runtime_error("key:" + TYPE_KEY +
                               " Is either not defined or not a string");

    if (obj.contains(OCCUR_KEY) && obj[OCCUR_KEY].is_number_integer())
      selections = obj[OCCUR_KEY].get<int>();
    else
      throw std::runtime_error("key:" + OCCUR_KEY +
                               " Is either not defined or not a string");

    const auto existing = this->requiredSelections.find(activityCode);
    if (existing != this->requiredSelections.end()) {
      if (existing->second != selections) {
        throw std::runtime_error("Inconsistent requiredSelections for activityCode " +
                                 activityCode);
      }
      continue;
    }
    this->requiredSelections.insert({activityCode, selections});
  }
}

