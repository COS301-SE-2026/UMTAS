#include "GA_handler/GA.h"
#include "filecreator/filecreator.h"
#include "nlohmann/json.hpp"
#include <exception>
#include <iomanip>
#include <iostream>
#include <ostream>
#include <sstream>
#include <string>

std::string minutesToTime(int minutesAfterMidnight) {
  int hours = minutesAfterMidnight / 60;
  int minutes = minutesAfterMidnight % 60;
  string hourPad = "";
  string minPad = "";
  if (hours < 10) {
    hourPad = '0';
  }
  if (minutes < 10) {
    minPad = '0';
  }
  std::ostringstream oss;
  oss << hourPad << hours << ":" << minPad << minutes;

  return oss.str();
}

using nlohmann::json;
int main() {
  // args will be provided for a filepath.
  try {
    FileCreator FC("GA_TEST_DIR");

    API_DATA data = API_DATA(FC.inputJson());
    GA_Handler engine(data);
    EventChromosome result = engine.findSolution();
    for (EventGA event : result.events) {
      if (event.is_active) {
        std::cout << "\nEventID: " << event.eventID << std::endl;
        std::cout << "Event day: " << event.eventDay << std::endl;
        std::cout << "Event times : " << minutesToTime(event.event_start)
                  << "->" << minutesToTime(event.event_end) << std::endl;
        std::cout << "Event Type: " << event.eventType << std::endl;
        std::cout << std::endl;
      }
    }

  } catch (std::exception &e) {
    std::cout << e.what() << std::endl;
    return 1;
  }
  return 0;
}
