#include "API-data.h"
#include "../../heuristic/Decorators/baseHeuristic.h"
#include "../../heuristic/Handlers/handler.h"
#include "nlohmann/json.hpp"
#include <stdexcept>
// const string API_DATA::TARGET_TIME_KEY = "preferences";

const string preferencesKey = "preferences";
const string heuristicArrKey = "heuristics";

API_DATA::API_DATA(const json &reqData) {
  if (reqData.empty()) {
    throw std::runtime_error("Input json is empty");
  }
  Handler *chain = createHandlerChain();

  try {
    if (reqData.contains("schedulingProblem") &&
        reqData["schedulingProblem"].contains(EventGA::GROUPING_KEY) &&
        reqData["schedulingProblem"][EventGA::GROUPING_KEY].is_array()) {
      const json &events = reqData["schedulingProblem"][EventGA::GROUPING_KEY];
      this->events = EventGA::initEvents(events);
      json modulesByCode = json::object();
      for (const auto &event : events) {
        const string moduleCode = event["moduleCode"].get<string>();
        if (!modulesByCode.contains(moduleCode)) {
          modulesByCode[moduleCode] = {{"moduleCode", moduleCode},
                                       {"activityRequirements", json::array()}};
        }
        modulesByCode[moduleCode]["activityRequirements"].push_back(
            {{"activityCode", event["activityCode"]},
             {"requiredSelections", event.value("requiredSelections", 1)}});
      }
      json modules = json::array();
      for (auto &entry : modulesByCode.items())
        modules.push_back(entry.value());
      this->modules = ModuleGA::innitModules(modules);
    } else {
      throw std::runtime_error(
          "schedulingProblem.events is not provided or is not an array");
    }

    this->decorators = new BaseHeuristic();

    if (reqData.contains(preferencesKey) &&
        reqData[preferencesKey].is_object()) {
      const auto &pref = reqData[preferencesKey];
      if (pref.contains(heuristicArrKey) && pref[heuristicArrKey].is_array()) {
        std::vector<nlohmann::json> heuristicsArr =
            pref[heuristicArrKey].get<std::vector<nlohmann::json>>();

        if (heuristicsArr.size() > 0)
          for (const json &heuristic : heuristicsArr) {
            this->decorators =
                this->decorators->setHead(chain->getHeuristic(heuristic));
          }
        else {
          delete this->decorators;
          this->decorators = nullptr;
        }
      }
    }

    /*
    this->targetTime = 420;

    if (reqData.contains(TARGET_TIME_KEY) &&
    reqData[TARGET_TIME_KEY].contains("heuristics")) { for (const auto&
    preference : reqData[TARGET_TIME_KEY]["heuristics"]) { if
    (preference.value("key", "") == "preferred-start-time" &&
            preference.contains("parameters") &&
            preference["parameters"].contains("minutesAfterMidnight")) {
          this->targetTime =
    preference["parameters"]["minutesAfterMidnight"].get<int>();
        }
      }

    }
    */

    // Handler construction and so on

    delete chain;
    chain = nullptr;
  } catch (const json::parse_error &e) {
    if (chain)
      delete chain;
    throw std::runtime_error(string("Json parse error: ") + e.what());

  } catch (const json::type_error &e) {
    if (chain)
      delete chain;
    throw std::runtime_error(string("Json type error: ") + e.what());

  } catch (const json::exception &e) {
    if (chain)
      delete chain;
    throw std::runtime_error(string("Json exception: ") + e.what());

  } catch (const std::runtime_error &e) {
    if (chain)
      delete chain;
    throw std::runtime_error(string("Could not create API_DATA: ") + e.what());
  }
}

API_DATA::API_DATA(const API_DATA &copy) {
  this->modules = copy.modules;
  this->events = copy.events;
  if (copy.decorators)
    this->decorators = copy.decorators->copy();
  else
    this->decorators = nullptr;
}
API_DATA::~API_DATA() {
  if (decorators)
    delete decorators;
}
