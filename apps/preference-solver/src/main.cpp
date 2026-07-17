#include "CP_SOLVER/CP.h"
#include "GA_handler/GA.h"
#include "nlohmann/json.hpp"

#include <exception>
#include <fstream>
#include <iostream>
#include <string>

using nlohmann::json;

int main(int argc, char *argv[]) {
  try {
    std::string inputPath;
    std::string outputPath;
    std::string engine = "cp-sat";
    std::string solveMode = "optimization";
    for (int index = 1; index < argc; ++index) {
      const std::string argument = argv[index];
      if ((argument == "--input" || argument == "--output" ||
           argument == "--engine" || argument == "--solve-mode") &&
          index + 1 >= argc) {
        throw std::runtime_error("Missing value for " + argument);
      }
      if (argument == "--input") inputPath = argv[++index];
      else if (argument == "--output") outputPath = argv[++index];
      else if (argument == "--engine") engine = argv[++index];
      else if (argument == "--solve-mode") solveMode = argv[++index];
      else throw std::runtime_error("Unsupported argument: " + argument);
    }
    if (inputPath.empty() || outputPath.empty() ||
        (engine != "cp-sat" && engine != "ga") ||
        (solveMode != "feasibility" && solveMode != "optimization")) {
      throw std::runtime_error(
          "Usage: solver --input <path> --output <path> --engine <cp-sat|ga> --solve-mode <feasibility|optimization>");
    }

    std::ifstream inputFile(inputPath);
    if (!inputFile.is_open()) {
      throw std::runtime_error("Could not open solver input");
    }
    json input;
    inputFile >> input;

    API_DATA data(input);
    EventChromosome result =
        engine == "cp-sat" ? CP_SOLVER(data, solveMode == "optimization").solve()
                           : GA_Handler(data, solveMode == "optimization").findSolution();

    std::ofstream outputFile(outputPath);
    if (!outputFile.is_open()) {
      throw std::runtime_error("Could not open solver output");
    }
    outputFile << result.returnJson(solveMode).dump(4);
  } catch (const std::exception &error) {
    std::cout << error.what() << std::endl;
    return 1;
  }
  return 0;
}
