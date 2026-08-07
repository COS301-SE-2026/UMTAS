#ifndef BASEHEURISTIC_H
#define BASEHEURISTIC_H

#include "../../data/GA-data/chromosome.h"
class BaseHeuristic {

public:
    virtual ~BaseHeuristic(){}
  virtual double calculateHeursitic(EventChromosome events,double value) {
    return  value;

};

};

#endif
