#include "../Events/event.h"
#include "../Modules/module.h"
#include <iostream>
#include <string>
#include <vector>
using std::cout;
using std::endl;
using std::string;

struct API_DATA {
  API_DATA() {}
  std::vector<ModuleGA> modules;
  std::vector<EventGA> events;
  int targetTime;
};
