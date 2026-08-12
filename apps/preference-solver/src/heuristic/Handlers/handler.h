#ifndef HANDLER_H
#define HANDLER_H
#include "../Decorators/baseHeuristic.h"
#include "nlohmann/json.hpp"
#include <string>
using std::string;

/*
 Expected to get an index of heursitics array
    "preferences": {
        "heuristics": [
          {
            "key": "preferred-start-time",
            "parameters": { "minutesAfterMidnight": 420 }
          }
        ]
      }
 */

class Handler {
protected:
  const string key;
  const string paramKey = "parameters";
  Handler *next = nullptr;

public:
  Handler(string key) : key(key) {}

  void setNext(Handler *next) {
    if (this->next)
      this->next->setNext(next);
    else
      this->next = next;
  }

  virtual ~Handler() {
    if (this->next) {
      delete next;
    }
  }
  virtual BaseHeuristic *getHeuristic(nlohmann::json input) {
    if (next) {
      return next->getHeuristic(input);
    } else {
      return nullptr; // -> unaccounted for case
    }
  }

  virtual json getParams(json input);
};

class TargetStartTimeHandler : public Handler {
private:
  const string targetKey = "minutes-After-midnight";

public:
  TargetStartTimeHandler() : Handler("preferred-start-time") {}
  virtual ~TargetStartTimeHandler() {}
  virtual BaseHeuristic *getHeuristic(nlohmann::json input);
};

class SkipDayHandler : public Handler {
private:
  const string targetKey = "day-to-skip";

public:
  virtual ~SkipDayHandler() {}
  SkipDayHandler() : Handler("day-skip") {}
  virtual BaseHeuristic *getHeuristic(nlohmann::json input);
};

Handler *createHandlerChain();

#endif
