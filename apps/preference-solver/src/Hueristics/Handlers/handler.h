#ifndef HANDLER_H
#define HANDLER_H
#include "../Decorators/baseHeuristic.h"
#include "nlohmann/json.hpp"
#include <string>
using std::string;

class Handler {
protected:
  Handler *next = nullptr;
  string key;

public:
  Handler(string key, Handler *next = nullptr) {
    this->key = key;
    this->next = next;
  }

  virtual ~Handler() {
    if (this->next) {
      delete next;
    }
  }
  virtual BaseHeuristic *getHeuristic(nlohmann::json input) = 0;
};

#endif
