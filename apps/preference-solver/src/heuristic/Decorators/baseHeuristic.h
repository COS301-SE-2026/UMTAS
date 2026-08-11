#ifndef BASEHEURISTIC_H
#define BASEHEURISTIC_H

#include "../../data/GA-data/chromosome.h"
#include <stdexcept>
class BaseHeuristic {

public:
  virtual ~BaseHeuristic() {}
  virtual double calculateHeursitic(EventChromosome events) { return 0; };

  /**
   * @brief adds this object as next of ptr and then returns ptr as the new head
   * @param ptr Pointer to new head
   * @return BaseHeuristic* The new head of the decorator chain.
   */
  virtual BaseHeuristic *setHead(BaseHeuristic *ptr) {
    if (ptr) {
      ptr->setNext(this);
      return ptr;
    } else
      return this;
  }

  virtual BaseHeuristic *copy() { return new BaseHeuristic(); }

  virtual void setNext(BaseHeuristic *ptr) {
    throw std::runtime_error("Base Heuristic set next should not be called");
  }
};

#endif
