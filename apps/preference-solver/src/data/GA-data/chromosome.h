#include "../API/API-data.h"
#include <vector>
struct EventChromosome {
  std::vector<EventGA> events;
  int targetTime = 0;
  int numActive = 0;
  int numCollision = 0;
  EventChromosome() {};
  EventChromosome(API_DATA &data);
  EventChromosome(const EventChromosome &chrom);
  EventChromosome &operator=(const EventChromosome &chrom);
};
struct ChromMiddleCost {
  double penalty_score = 0;
  ChromMiddleCost() {};
};
