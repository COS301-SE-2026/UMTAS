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
  Handler *next = nullptr;
public:
  Handler() {}
   void setNext(Handler * next){
      this->next = next;
  }

  virtual ~Handler() {
    if (this->next) {
      delete next;
    }
  }
  virtual BaseHeuristic *getHeuristic(nlohmann::json input) = 0;
};

class TargetTimeHandler:public Handler{


    const string key = "preferred-start-time";
    TargetTimeHandler(): Handler() {
    }
     virtual BaseHeuristic *getHeuristic(nlohmann::json input);

};

#endif
