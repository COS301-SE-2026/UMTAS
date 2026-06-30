#include "module.h"
#include <stdexcept>
#include <vector>

 const string ModuleGA::GROUPING_KEY = "modules";
 const string ModuleGA::MODULE_CODE_KEY = "moduleCode";
 const string ModuleGA::OCCURENCE_KEY ="moduleOccurence";

ModuleGA::ModuleGA(json module) {}

std::vector<ModuleGA> ModuleGA::innitModules(json &modulesArr) {
  std::vector<ModuleGA> retModules;

  if (modulesArr.is_array()) {
    for (auto &module : modulesArr) {
      retModules.push_back(ModuleGA(module));
    }
    return retModules;
  } else {
    throw std::runtime_error("key:" + GROUPING_KEY + " Is not an array");
  }
}
