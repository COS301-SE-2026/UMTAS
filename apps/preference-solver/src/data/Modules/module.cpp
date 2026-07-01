#include "module.h"
#include "nlohmann/json.hpp"
#include <stdexcept>
#include <string>
#include <vector>

const string ModuleGA::GROUPING_KEY = "modules";
const string ModuleGA::MODULE_CODE_KEY = "moduleCode";
const string ModuleGA::OCCUR_ARRAY_KEY = "typeOccurence";
const string ModuleGA::TYPE_KEY = "EventType";
const string ModuleGA::OCCUR_KEY = "numberOccur";
/*
 typeOccurence :[
 {
    type : string
    numberOccur : int
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
    this->handleOccurences(module[OCCUR_ARRAY_KEY]);
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

void ModuleGA::handleOccurences(const json& types) {
  // finds the array of entries in the occurences object adds key value pairs.
  //    type : string
  //    numberOccur : int

  for (auto &obj : types) {
    string type;
    int occur;
    if (obj.contains(TYPE_KEY) && obj[TYPE_KEY].is_string())
      type = obj[TYPE_KEY].get<string>();
    else
      throw std::runtime_error("key:" + TYPE_KEY +
                               " Is either not defined or not a string");

    if (obj.contains(OCCUR_KEY) && obj[OCCUR_KEY].is_number_integer())
      occur = obj[OCCUR_KEY].get<int>();
    else
      throw std::runtime_error("key:" + OCCUR_KEY +
                               " Is either not defined or not a string");

    this->number_Occur.insert({type, occur});
  }
}
