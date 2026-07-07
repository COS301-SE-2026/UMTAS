#ifndef MODULE_H
#define MODULE_H

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
  // hash map for the number of occurences for each type of event
  std::unordered_map<string, int> number_Occur;
  ModuleGA(const json& module);
  static std::vector<ModuleGA> innitModules(const json &modulesArr);
  // sets the number of occurences for a module specifcally a type
  void handleOccurences(const json& types);
};

#endif
