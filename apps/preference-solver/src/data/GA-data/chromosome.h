#include "../API/API-data.h"
#include <string>
#include <unordered_map>
#include <vector>
struct EventChromosome {
  std::vector<EventGA> events;
  std::unordered_map<std::string, int> requiredSelections;
  int targetTime = 0;
  int numActive = 0;
  int numCollision = 0;
  EventChromosome() {};
  EventChromosome(API_DATA &data);
  bool hasValidSelectionPattern() const;
  json returnJson();
};
struct ChromMiddleCost {
  double penalty_score = 0;
  ChromMiddleCost() {};
};
#pragma once

