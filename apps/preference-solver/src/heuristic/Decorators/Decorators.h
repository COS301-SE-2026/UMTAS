#ifndef DECORATOR_H
#define DECORATOR_H

#include "baseHeuristic.h"
#include <iostream>
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
  /**
   * @brief returns a copy of the next -> there should never be a base decorator
   * in the chain
   */
  virtual BaseHeuristic *copy() {
    BaseHeuristic *nextCopy = next->copy();
    return nextCopy;
  }
};
class TargetStartTime : public H_Decorator {

private:
  int minutesToMidnight = 0;

public:
  TargetStartTime(int targetTime) { this->minutesToMidnight = targetTime; }
  virtual ~TargetStartTime() { std::cout << "Delete target time" << std::endl; }
  virtual double calculateHeursitic(EventChromosome events);

  virtual BaseHeuristic *copy() {
    BaseHeuristic *thisCopy = new TargetStartTime(this->minutesToMidnight);
    thisCopy->setNext(H_Decorator::copy());
    return thisCopy;
  }
};
class SkipDayDec : public H_Decorator {

private:
  string day;

public:
  SkipDayDec(string day) : day(day) {}
  virtual ~SkipDayDec() { std::cout << "Delete skip day" << std::endl; }
  virtual double calculateHeursitic(EventChromosome events);

  virtual BaseHeuristic *copy() {
    BaseHeuristic *thisCopy = new SkipDayDec(this->day);
    thisCopy->setNext(H_Decorator::copy());
    return thisCopy;
  }
};

#endif
