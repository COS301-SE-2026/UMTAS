#include "chromosome.h"

EventChromosome::EventChromosome(API_DATA &data) {
  this->events = data.events;
  this->targetTime = data.targetTime;
}

EventChromosome::EventChromosome(const EventChromosome &chrom) {
  this->events.resize(chrom.events.size());
  int index = 0;
  for (EventGA event : chrom.events) {
    this->events[index++] = event;
  }
}

EventChromosome &EventChromosome::operator=(const EventChromosome &chrom) {
  if (this == &chrom) {
    return *this;
  }
  this->events.resize(chrom.events.size());
  int index = 0;
  for (EventGA event : chrom.events) {
    this->events[index++] = event;
  }
  return *this;
}
