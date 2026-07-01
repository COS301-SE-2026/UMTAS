#include "../API/API-data.h"
#include <vector>
struct EventChromosome {
  std::vector<EventGA> events;
  int targetTime;
  EventChromosome(){};
  EventChromosome(API_DATA &data);
  EventChromosome(const EventChromosome &chrom);
  EventChromosome &operator=(const EventChromosome &chrom);
};
struct ChromMiddleCost {
  double penalty_score = 0;
  ChromMiddleCost() {};
};
