#include "API-data.h"
API_DATA::API_DATA(string jsonStr) {
  json reqData = json::parse(jsonStr);
  json modules = reqData[ModuleGA::GROUPING_KEY];
  this->modules = ModuleGA::innitModules(modules);
}
