#include "Decorators.h"

double SkipDayDec::calculateHeursitic(EventChromosome events) {
  std::cout << "Skip day heuristic ran" << std::endl;
  double score = 0;
  for (const EventGA &event : events.events) {
    if (event.dayOfWeek == day) {
      score += 100;
    }
  }
  return score + H_Decorator::calculateHeursitic(
                     events); // for every event on the same day it theres a
                              // penalty applied
}
