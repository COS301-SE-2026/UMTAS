#include "API-data.h"
#include "nlohmann/json.hpp"
#include <stdexcept>

const string API_DATA::TARGET_TIME_KEY = "targetTime";

API_DATA::API_DATA(const json& reqData) {
  try {
    this->modules =
        ModuleGA::innitModules(reqData[ModuleGA::GROUPING_KEY].get<json>());

    this->events =
        EventGA::initEvents(reqData[EventGA::GROUPING_KEY].get<json>());

    if (reqData.contains(TARGET_TIME_KEY) && reqData.is_number_integer())
      this->targetTime = reqData[TARGET_TIME_KEY].get<int>();
    else
      throw std::runtime_error(TARGET_TIME_KEY +
                               " is not defined or is not an integer");

  } catch (const json::parse_error &e) {
    // this is for errors casued by library misuse
    throw std::runtime_error(string("Json error: ") + e.what());

  } catch (const std::runtime_error &e) {
    // this is for our errors
    throw std::runtime_error(string("Could not create API_DATA: ") + e.what());
  }
}
