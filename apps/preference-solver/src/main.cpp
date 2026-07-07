#include "GA_handler/GA.h"
#include "filecreator/filecreator.h"
#include "nlohmann/json.hpp"
#include <exception>
#include <iostream>
#include <ostream>
#include <sstream>
#include <string>

const std::string solver = "CP"; //GA

using nlohmann::json;
// args will be provided for a filepath.
int main() {
  //Specify Input directory - aswell as output
  FileCreator FC("TEST_DIR");

  //Convert input data to ModuleGA and EventGA objects
  API_DATA data = API_DATA(FC.inputJson());

  if (solver=="CP"){
    //Run CP solver
    
  } else {
    //Run GA solver

    
    try {
      
      GA_Handler engine(data);
      EventChromosome result = engine.findSolution();
      FC.outputJson(result.returnJson());

    } catch (std::exception &e) {
      std::cout << e.what() << std::endl;
      return 1;
    }
  }

  return 0;
}
