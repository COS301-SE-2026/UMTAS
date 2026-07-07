#ifndef CHROMOSOME_H
#define CHROMOSOME_H

#include "../API/API-data.h"
#include <vector>
struct EventChromosome {
  std::vector<EventGA> events;
  int targetTime = 0;
  int numActive = 0;
  int numCollision = 0;
  EventChromosome() {};
  EventChromosome(API_DATA &data);
  // a json that contains only the events array?
  json returnJson();
};
struct ChromMiddleCost {
  double penalty_score = 0;
  ChromMiddleCost() {};
};

#endif