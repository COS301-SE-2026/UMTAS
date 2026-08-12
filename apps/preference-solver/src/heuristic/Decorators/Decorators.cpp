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
