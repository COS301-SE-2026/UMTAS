#include <iostream>
#include <string>
using std::cout;
using std::endl;
using std::string;

struct ModuleGA {
  static const string key;
  string moduleCode;
  int number_Occur;
  ModuleGA(string json);
};
