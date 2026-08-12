#include "Decorators.h"
#include <iostream>

double TargetStartTime::calculateHeursitic(EventChromosome events) {
  std::cout << "Target time heuristic ran" << std::endl;
  int numberOfPts = 0;
  int target = this->minutesToMidnight;
  double sum = 0;
  for (const EventGA &event : events.events) {

    if (event.is_active) {
      numberOfPts++;
      sum += std::fabs(event.event_start - target);
    }
  }
  if (numberOfPts == 0)
    return 0.0;
  double MAD = (1 / (double)numberOfPts) * sum;

  return MAD + H_Decorator::calculateHeursitic(events); // this calls next
}
