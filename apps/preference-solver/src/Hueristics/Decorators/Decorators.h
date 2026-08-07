#ifndef DECORATOR_H
#define DECORATOR_H

#include "baseHeuristic.h"
#include <stdexcept>
class H_Decorator : public BaseHeuristic {
protected:
  BaseHeuristic *next = nullptr;

public:
  void setNext(BaseHeuristic *next) { this->next = next; }
  virtual ~H_Decorator() { delete next; }
  // each base class will call the parent + their value
  virtual double calculateHeursitic(EventChromosome events) {
    if (next)
      return next->calculateHeursitic(events);
    else
      throw std::runtime_error("Heuristic Decorators not Built correctly");
  };
};
class TargetStartTime : public H_Decorator {

private:
  int minutesToMidnight = 0;

public:
  TargetStartTime(int targetTime) { this->minutesToMidnight = targetTime; }
  virtual ~TargetStartTime() {}
  virtual double calculateHeursitic(EventChromosome events);
};
#endif
