#include "chromosome.h"

EventChromosome::EventChromosome(API_DATA &data) {
  this->events = data.events;
  this->targetTime = data.targetTime;
}

json EventChromosome::returnJson() {
  json obj;
  obj[EventGA::GROUPING_KEY] = json::array();
  for (EventGA event : this->events) {
    if (event.is_active)
      obj[EventGA::GROUPING_KEY].push_back(event.returnJson());
  }
  return obj;
}
