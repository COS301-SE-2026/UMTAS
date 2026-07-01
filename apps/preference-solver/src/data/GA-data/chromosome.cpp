#include "chromosome.h"

EventChromosome::EventChromosome(API_DATA &data) {
  this->events = data.events;
  this->targetTime = data.targetTime;
}


