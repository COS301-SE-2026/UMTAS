#ifndef DECORATOR_H
#define DECORATOR_H

#include "baseHeuristic.h"
#include <stdexcept>

class H_Decorator : public BaseHeuristic {
protected:
  BaseHeuristic *next = nullptr;

public:
  void setNext(BaseHeuristic *next) { this->next = next; }
  H_Decorator() {}
  virtual ~H_Decorator() {
    if (next)
      delete next;
    next = nullptr;
  }

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
    if (next == nullptr) {
      throw std::runtime_error(
          "Decorator chain is missing a terminal BaseHeuristic node");
    }
    return next->copy();
  }
};
class TargetStartTime : public H_Decorator {

private:
  int minutesToMidnight = 0;

public:
  TargetStartTime(int targetTime) { this->minutesToMidnight = targetTime; }
  virtual ~TargetStartTime() {}
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
  SkipDayDec(string day) : H_Decorator(), day(day) {}
  virtual ~SkipDayDec() {}
  virtual double calculateHeursitic(EventChromosome events);

  virtual BaseHeuristic *copy() {
    BaseHeuristic *thisCopy = new SkipDayDec(this->day);
    thisCopy->setNext(H_Decorator::copy());
    return thisCopy;
  }
};

class SmallGapsDec : public H_Decorator {
private:
public:
  SmallGapsDec() : H_Decorator() {}
  virtual ~SmallGapsDec() {}
  virtual double calculateHeursitic(EventChromosome events);

  virtual BaseHeuristic *copy() {
    BaseHeuristic *thisCopy = new SmallGapsDec();
    thisCopy->setNext(H_Decorator::copy());
    return thisCopy;
  }
};

#endif
