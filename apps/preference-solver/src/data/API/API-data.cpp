#include "API-data.h"
#include <stdexcept>
API_DATA::API_DATA(string jsonStr) {
  try {
    json reqData = json::parse(jsonStr);
    json modules = reqData[ModuleGA::GROUPING_KEY];
    this->modules = ModuleGA::innitModules(modules);
  } catch (const json::parse_error &e) {
      // this is for errors casued by library misuse
    throw std::runtime_error(string("Json error: ") + e.what());
  } catch (const std::runtime_error &e) {
      // this is for our errors
    throw std::runtime_error(string("Could not create API_DATA: ") + e.what());
  }
}
