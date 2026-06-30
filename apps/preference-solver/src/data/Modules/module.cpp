#include "module.h"
#include <stdexcept>
#include <vector>

const string ModuleGA::GROUPING_KEY = "modules";
const string ModuleGA::MODULE_CODE_KEY = "moduleCode";
const string ModuleGA::OCCURENCE_KEY = "moduleOccurence";

ModuleGA::ModuleGA(json module) {
  if (module.contains(MODULE_CODE_KEY) && module[MODULE_CODE_KEY].is_string()) {
    this->moduleCode = module[MODULE_CODE_KEY];
  } else {
    throw std::runtime_error(MODULE_CODE_KEY +
                             "is not defined or is not a string");
  }

  if (module.contains(OCCURENCE_KEY) &&
      module[OCCURENCE_KEY].is_number_integer()) {
    this->moduleCode = module[OCCURENCE_KEY];
  } else {
    throw std::runtime_error(OCCURENCE_KEY +
                             "is not defined or is not an Integer");
  }
}

std::vector<ModuleGA> ModuleGA::innitModules(json &modulesArr) {
  std::vector<ModuleGA> retModules;

  if (modulesArr.is_array()) {
    for (auto &module : modulesArr) {
      retModules.push_back(ModuleGA(module));
    }
    return retModules;
  } else {
    throw std::runtime_error("key:" + GROUPING_KEY + " Is not an array init Modules");
  }
}
