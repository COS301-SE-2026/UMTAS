#include "API-data.h"
#include <stdexcept>

const string API_DATA::TARGET_TIME_KEY = "targetTime";

API_DATA::API_DATA(string jsonStr) {
  try {
    json reqData = json::parse(jsonStr);
    this->modules = ModuleGA::innitModules(reqData[ModuleGA::GROUPING_KEY]);
    this->events = EventGA::initEvents(reqData[EventGA::GROUPING_KEY]);
    this->targetTime = reqData[TARGET_TIME_KEY];
  } catch (const json::parse_error &e) {
    // this is for errors casued by library misuse
    throw std::runtime_error(string("Json error: ") + e.what());
  } catch (const std::runtime_error &e) {
    // this is for our errors
    throw std::runtime_error(string("Could not create API_DATA: ") + e.what());
  }
}
