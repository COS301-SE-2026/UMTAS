#include <iostream>
#include <string>
#include <vector>
#include "../../../lib/nlohmann/json.hpp"
using std::cout;
using std::endl;
using std::string;
using nlohmann::json;
struct ModuleGA {
  static const string GROUPING_KEY;
    static const string MODULE_CODE_KEY;
      static const string OCCURENCE_KEY;
  string moduleCode;
  int number_Occur;
  ModuleGA(json module);
  static std::vector<ModuleGA> innitModules(json& modulesArr);
};
