#include "API-data.h"
#include "nlohmann/json.hpp"
#include <stdexcept>

const string API_DATA::TARGET_TIME_KEY = "preferences";

API_DATA::API_DATA(const json &reqData) {
  if (reqData.empty()) {
    throw std::runtime_error("Input json is empty");
  }

  try {
    if (reqData.contains("schedulingProblem") &&
        reqData["schedulingProblem"].contains(EventGA::GROUPING_KEY) &&
        reqData["schedulingProblem"][EventGA::GROUPING_KEY].is_array()) {
      const json& events = reqData["schedulingProblem"][EventGA::GROUPING_KEY];
      this->events = EventGA::initEvents(events);
      json modulesByCode = json::object();
      for (const auto& event : events) {
        const string moduleCode = event["moduleCode"].get<string>();
        if (!modulesByCode.contains(moduleCode)) {
          modulesByCode[moduleCode] = {{"moduleCode", moduleCode}, {"activityRequirements", json::array()}};
        }
        modulesByCode[moduleCode]["activityRequirements"].push_back({
          {"activityCode", event["activityCode"]},
          {"requiredSelections", event.value("requiredSelections", 1)}
        });
      }
      json modules = json::array();
      for (auto& entry : modulesByCode.items()) modules.push_back(entry.value());
      this->modules = ModuleGA::innitModules(modules);
    }
    else {
      throw std::runtime_error("schedulingProblem.events is not provided or is not an array");
    }

    this->targetTime = 420;
    if (reqData.contains(TARGET_TIME_KEY) && reqData[TARGET_TIME_KEY].contains("heuristics")) {
      for (const auto& preference : reqData[TARGET_TIME_KEY]["heuristics"]) {
        if (preference.value("key", "") == "preferred-start-time" &&
            preference.contains("parameters") &&
            preference["parameters"].contains("minutesAfterMidnight")) {
          this->targetTime = preference["parameters"]["minutesAfterMidnight"].get<int>();
        }
      }
    }
    
  } catch (const json::parse_error &e) {
    // this is for errors casued by library misuse
    throw std::runtime_error(string("Json error: ") + e.what());

  } catch (const std::runtime_error &e) {
    // this is for our errors
    throw std::runtime_error(string("Could not create API_DATA: ") + e.what());
  }
}

