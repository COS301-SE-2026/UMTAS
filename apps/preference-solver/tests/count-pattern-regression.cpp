#include "../src/GA_handler/GA.h"
#include "../src/heuristic/Handlers/handler.h"
#include "nlohmann/json.hpp"
#include <cassert>
#include <iostream>
#include <stdexcept>
void heuristicTesting();
void handlerTesting();
template <typename Callable> void assertThrows(Callable callable) {
  bool threw = false;
  try {
    callable();
  } catch (const std::runtime_error &) {
    threw = true;
  }
  assert(threw);
}

int main() {
  const json input = {
      {"schedulingProblem",
       {{"events",
         {{{"eventId", "CS101-L1-A"},
           {"moduleCode", "CS101"},
           {"activityType", "lecture"},
           {"activityCode", "L1"},
           {"requiredSelections", 1},
           {"dayOfWeek", "monday"},
           {"startTime", "08:00"},
           {"endTime", "09:00"}},
          {{"eventId", "CS101-T1-A"},
           {"moduleCode", "CS101"},
           {"activityType", "tutorial"},
           {"activityCode", "T1"},
           {"requiredSelections", 1},
           {"dayOfWeek", "monday"},
           {"startTime", "10:00"},
           {"endTime", "11:00"}}}}}},
      {"preferences", {{"heuristics", json::array()}}},
  };

  API_DATA data(input);
  GA_Handler handler(data);

  EventChromosome invalid(data);
  invalid.events[0].is_active = true;
  invalid.numActive = 2;
  assert(!CountPattern(invalid));

  EventChromosome valid(data);
  valid.events[0].is_active = true;
  valid.events[1].is_active = true;
  valid.numActive = 2;
  assert(CountPattern(valid));

  json unsatisfiedInput = input;
  unsatisfiedInput["schedulingProblem"]["events"][0]["requiredSelections"] = 2;
  API_DATA unsatisfiedData(unsatisfiedInput);
  EventChromosome unsatisfied(unsatisfiedData);
  unsatisfied.events[0].is_active = true;
  unsatisfied.events[1].is_active = true;
  assert(unsatisfied.returnJson().at("status") == "infeasible");

  json malformedTime = input;
  malformedTime["schedulingProblem"]["events"][0]["startTime"] = "8:00";
  assertThrows([&] { API_DATA malformedData(malformedTime); });

  json nonPositiveDuration = input;
  nonPositiveDuration["schedulingProblem"]["events"][0]["endTime"] = "08:00";
  assertThrows([&] { API_DATA nonPositiveDurationData(nonPositiveDuration); });

  json inconsistentRequirements = input;
  inconsistentRequirements["schedulingProblem"]["events"][1]["activityCode"] =
      "L1";
  inconsistentRequirements["schedulingProblem"]["events"][1]
                          ["requiredSelections"] = 2;
  assertThrows([&] { API_DATA inconsistentData(inconsistentRequirements); });

  json mutationInput = input;
  mutationInput["schedulingProblem"]["events"].push_back(
      {{"eventId", "CS101-L1-B"},
       {"moduleCode", "CS101"},
       {"activityType", "lecture"},
       {"activityCode", "L1"},
       {"requiredSelections", 1},
       {"dayOfWeek", "tuesday"},
       {"startTime", "08:00"},
       {"endTime", "09:00"}});
  API_DATA mutationData(mutationInput);
  GA_Handler mutationHandler(mutationData);
  EventChromosome mutationSource(mutationData);
  mutationSource.events[0].is_active = true;
  mutationSource.events[1].is_active = true;
  mutationSource.numActive = 2;
  const EventChromosome mutated =
      mutate(mutationSource, [] { return 0.0; }, 0.0);
  int activeEvents = 0;
  for (const EventGA &event : mutated.events) {
    if (event.is_active)
      ++activeEvents;
  }
  assert(activeEvents == 2);
  assert(mutated.hasValidSelectionPattern());

  EA::ChromosomeType<EventChromosome, ChromMiddleCost> earlySelection;
  earlySelection.genes = EventChromosome(mutationData);
  earlySelection.genes.events[0].is_active = true;
  earlySelection.genes.events[1].is_active = true;
  EA::ChromosomeType<EventChromosome, ChromMiddleCost> lateSelection;
  lateSelection.genes = EventChromosome(mutationData);
  lateSelection.genes.events[1].is_active = true;
  lateSelection.genes.events[2].is_active = true;
  assert(calculate_conflict_total_fitness(earlySelection) == 0.0);
  assert(calculate_conflict_total_fitness(lateSelection) == 0.0);

  heuristicTesting();
}

/**
 * @brief tests the heuristics depending on the API data input.
 */
void heuristicTesting() { handlerTesting(); }
/**
 * @brief checks if the correct number of decorators are made for all keys
 */
void handlerTesting() {
  std::cout << "Starting handler test" << std::endl;
  const string preferencesKey = "preferences";
  const string heuristicArrKey = "heuristics";
  Handler *chain = createHandlerChain();

  json StartTimeH =
      json::array({{{"key", "preferred-start-time"},
                    {"parameters", {{"minutes-After-midnight", 420}}}}});

  json SkipDayH = json::array(
      {{{"key", "day-skip"}, {"parameters", {{"day-to-skip", "monday"}}}}});

  json pref;
  json heuristics = json::array();

  heuristics.push_back(StartTimeH[0]);
  heuristics.push_back(SkipDayH[0]);

  pref[preferencesKey][heuristicArrKey] = heuristics;

  std::vector<nlohmann::json> heuristicsArr =
      pref[preferencesKey][heuristicArrKey].get<std::vector<nlohmann::json>>();

  for (const json &heuristic : heuristicsArr) {
    BaseHeuristic *dec = chain->getHeuristic(heuristic);
    std::cout << "Decorator created" << std::endl;
    assert(dec != nullptr && "Handler miss-use unaccounted for case");
    if (dec)
      delete dec;
  }
  std::cout << "Ending handler test" << std::endl;
  delete chain;
}
