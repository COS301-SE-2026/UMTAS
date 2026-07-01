#include "../../../lib/nlohmann/json.hpp"
#include <iostream>
#include <string>
#include <vector>
using nlohmann::json;
using std::cout;
using std::endl;
using std::string;
struct ModuleGA {
  static const string GROUPING_KEY;
  static const string MODULE_CODE_KEY;
  static const string OCCURENCE_KEY;
  string moduleCode;
  int number_Occur;
  ModuleGA(json module);
  static std::vector<ModuleGA> innitModules(const json &modulesArr);
};
