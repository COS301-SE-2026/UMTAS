#include "GA_handler/GA.h"
#include "filecreator/filecreator.h"
#include "nlohmann/json.hpp"
#include <exception>
#include <iostream>
#include <ostream>

using nlohmann::json;
int main() {
  // args will be provided for a filepath.
  try {
    FileCreator FC("GA_TEST_DIR");

    API_DATA data = API_DATA(FC.inputJson());
    GA_Handler engine(data);
    engine.findSolution();

  } catch (std::exception &e) {
    std::cout << e.what() << std::endl;
    return 1;
  }
  return 0;
}
