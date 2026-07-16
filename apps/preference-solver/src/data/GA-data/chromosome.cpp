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

json EventChromosome::returnJson(const std::string &solveMode) {
  if (!hasValidSelectionPattern()) {
    return {{"status", "infeasible"}};
  }

  json selectedEventIds = json::array();
  json conflicts = json::array();
  std::vector<const EventGA *> selectedEvents;
  for (const EventGA &event : this->events) {
    if (event.is_active)
      selectedEventIds.push_back(event.eventId);
    if (event.is_active) selectedEvents.push_back(&event);
  }
  for (size_t first = 0; first < selectedEvents.size(); ++first) {
    for (size_t second = first + 1; second < selectedEvents.size(); ++second) {
      const EventGA &left = *selectedEvents[first];
      const EventGA &right = *selectedEvents[second];
      if (left.dayOfWeek == right.dayOfWeek &&
          left.event_start < right.event_end &&
          right.event_start < left.event_end) {
        conflicts.push_back(
            {{"eventIds", {left.eventId, right.eventId}}});
      }
    }
  }
  const bool conflictFree = conflicts.empty();
  return {{"status", "feasible"},
          {"outcome", conflictFree ? "conflict-free" : "best-effort"},
          {"timetableSolution", {{"selectedEventIds", selectedEventIds}}},
          {"heuristicScores", json::array()},
          {"metadata", {{"conflictCount", conflicts.size()},
                        {"conflicts", conflicts},
                        {"solveMode", solveMode}}}};
}
