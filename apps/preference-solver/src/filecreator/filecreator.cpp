#include "filecreator.h"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <ostream>
#include <stdexcept>
FileCreator::FileCreator(string path) {

  this->path = path;
  if (std::filesystem::exists(this->path) &&
      std::filesystem::exists(this->path / "input.json")) {

    std::cout << "File directory exists as well as input" << std::endl;
  } else {
    throw std::runtime_error("File path directory or input.json not provided");
  }
}
json FileCreator::inputJson() {
  std::ifstream file(this->path / "input.json");
  json inputJson;
  file >> inputJson;
  return inputJson;
}
void FileCreator::outputJson(json outputJson) {
  std::ofstream output(this->path / "output.json");

  if (!output.is_open()) {
    throw std::runtime_error("Could not create output.json");
  }
  output << outputJson.dump(4);
  std::cout << "Output successfully created" << std::endl;
}
