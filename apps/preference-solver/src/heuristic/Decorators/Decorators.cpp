#include "Decorators.h"
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <sstream>
#include <vector>
using std::stringstream;
using std::vector;
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

double SkipDayDec::calculateHeursitic(EventChromosome events) {
  std::cout << "Skip day heuristic ran" << std::endl;
  double score = 0;
  for (const EventGA &event : events.events) {
    if (event.dayOfWeek == day && event.is_active) {
      score += 1000;
    }
  }
  return score + H_Decorator::calculateHeursitic(
                     events); // for every event on the same day it theres a
                              // penalty applied
}

bool compareTimes(const EventGA &a, const EventGA &b) {
  if (a.event_start != b.event_start) {
    return a.event_start < b.event_start;
  }
  return a.event_end < b.event_end;
}

/**
 * @brief returns an ordered list in terms of start time for a given day
 */
vector<EventGA> getEventsOfDay(string day, EventChromosome events) {
  vector<EventGA> list;
  for (EventGA event : events.events) {
    if (event.dayOfWeek == day) {
      list.push_back(event);
    }
  }

  std::sort(list.begin(), list.end(), compareTimes);
  return list;
}

/**
 * @brief Calculates the score between hours
 * @description takes a start time and an end time and calculates the
 * distance between them negatively
 */
double SmallGapsDec::calculateHeursitic(EventChromosome events) {
  std::cout << "Small gap heuristic ran" << std::endl;
  double score = 0;
  vector<string> days = DayOfWeek::getDayOfWeek().getDaysArray();

  for (string day : days) {
    std::vector<EventGA> eventsOfDay = getEventsOfDay(day, events);

    for (size_t start = 0; start < eventsOfDay.size(); start++) {

      int end = start + 1;

      while (end < eventsOfDay.size() && eventsOfDay[end].is_active == false) {
        end++;
      }

      if (end >= eventsOfDay.size())
        break;

      score += eventsOfDay[end].event_start - eventsOfDay[start].event_end;
    }
  }

  return score * score + H_Decorator::calculateHeursitic(events);
}
