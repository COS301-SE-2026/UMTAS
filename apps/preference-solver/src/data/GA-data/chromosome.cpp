#include "chromosome.h"
#include <string>

EventChromosome::EventChromosome(API_DATA &data) {
  this->events = data.events;
  this->targetTime = data.targetTime;
  for (const ModuleGA &module : data.modules) {
    for (const auto &[activityCode, selections] : module.requiredSelections) {
      requiredSelections[module.moduleCode + ":" + activityCode] = selections;
    }
  }
}

bool EventChromosome::hasValidSelectionPattern() const {
  std::unordered_map<std::string, int> selectedCounts;
  for (const EventGA &event : this->events) {
    if (event.is_active) {
      selectedCounts[event.moduleCode + ":" + event.activityCode]++;
    }
  }

  for (const auto &[requirement, selections] : requiredSelections) {
    if (selectedCounts[requirement] != selections) return false;
  }

  for (const auto &[selection, count] : selectedCounts) {
    const auto requirement = requiredSelections.find(selection);
    if (requirement == requiredSelections.end() || requirement->second != count) {
      return false;
    }
  }

  return true;
}

json EventChromosome::returnJson() {
  if (!hasValidSelectionPattern()) {
    return {{"status", "infeasible"}};
  }

  json selectedEventIds = json::array();
  for (EventGA event : this->events) {
    if (event.is_active)
      selectedEventIds.push_back(event.eventId);
  }
  return {{"status", "feasible"}, {"timetableSolution", {{"selectedEventIds", selectedEventIds}}}, {"heuristicScores", json::array()}, {"metadata", json::object()}};
}

