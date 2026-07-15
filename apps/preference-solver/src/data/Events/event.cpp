#include "event.h"
#include "nlohmann/json.hpp"
#include <cctype>
#include <sstream>
#include <string>

#include <stdexcept>
const string EventGA::GROUPING_KEY = "events";
const string EventGA::DAY_OF_WEEK_KEY = "dayOfWeek";
const string EventGA::DATE_KEY = "date";
const string EventGA::EVENT_ID_KEY = "eventId";
const string EventGA::MODULE_CODE = "moduleCode";
const string EventGA::EVENT_START = "startTime";
const string EventGA::EVENT_END = "endTime";
const string EventGA::ACTIVITY_TYPE_KEY = "activityType";
const string EventGA::ACTIVITY_CODE_KEY = "activityCode";

int timeHelper(const std::string &);
bool typeCheckHelper(string key, json &obj);

EventGA::EventGA(json eventsJson) {
  try {
    if (eventsJson.contains(DAY_OF_WEEK_KEY)) {
      this->dayOfWeek = eventsJson[DAY_OF_WEEK_KEY].get<string>();
    } else if (eventsJson.contains(DATE_KEY)) {
      // A dated event is its own collision bucket.
      this->dayOfWeek = eventsJson[DATE_KEY].get<string>();
    } else {
      throw std::runtime_error("Event requires dayOfWeek or date");
    }

    if (typeCheckHelper(EVENT_ID_KEY, eventsJson)) {
      this->eventId = eventsJson[EVENT_ID_KEY].get<string>();
    }

    if (typeCheckHelper(MODULE_CODE, eventsJson)) {
      this->moduleCode = eventsJson[MODULE_CODE].get<string>();
    }

    if (typeCheckHelper(EVENT_START, eventsJson)) {
      this->event_start = timeHelper(eventsJson[EVENT_START].get<string>());
    }
    if (typeCheckHelper(EVENT_END, eventsJson)) {
      this->event_end = timeHelper(eventsJson[EVENT_END].get<string>());
    }
    if (this->event_end <= this->event_start) {
      throw std::runtime_error("endTime must be after startTime");
    }
    if (typeCheckHelper(ACTIVITY_TYPE_KEY, eventsJson)) {
      this->activityType = eventsJson[ACTIVITY_TYPE_KEY];
    }
    if (typeCheckHelper(ACTIVITY_CODE_KEY, eventsJson)) {
      this->activityCode = eventsJson[ACTIVITY_CODE_KEY];
    }

  } catch (std::runtime_error &e) {
    throw std::runtime_error(e.what());
  }
  this->is_active = false;
}

std::vector<EventGA> EventGA::initEvents(const json &eventJson) {
  std::vector<EventGA> retEvents;
  try {
    if (eventJson.is_array()) {
      for (auto &event : eventJson) {
        if (event.is_object())
          retEvents.push_back(EventGA(event));
      }
      return retEvents;
    } else {
      throw std::runtime_error("key:" + GROUPING_KEY +
                               " Is not an array init Events");
    }
  } catch (const std::runtime_error &e) {
    throw std::runtime_error(e.what());
  }
}

// helpers
bool typeCheckHelper(string key, json &obj) {
  if (obj.contains(key) && obj[key].is_string()) {
    return true;
  } else {
    throw std::runtime_error(key + "is not defined or is not a string");
  }
}

int timeHelper(const string &time) {
  if (time.size() != 5 || time[2] != ':' ||
      !std::isdigit(static_cast<unsigned char>(time[0])) ||
      !std::isdigit(static_cast<unsigned char>(time[1])) ||
      !std::isdigit(static_cast<unsigned char>(time[3])) ||
      !std::isdigit(static_cast<unsigned char>(time[4]))) {
    throw std::runtime_error("Time must use HH:MM format");
  }

  const int hours = (time[0] - '0') * 10 + (time[1] - '0');
  const int minutes = (time[3] - '0') * 10 + (time[4] - '0');
  if (hours > 23 || minutes > 59) {
    throw std::runtime_error("Time must be between 00:00 and 23:59");
  }

  return hours * 60 + minutes;
}

