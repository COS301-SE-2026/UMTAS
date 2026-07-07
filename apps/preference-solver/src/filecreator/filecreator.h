#ifndef FILECREATOR_H
#define FILECREATOR_H
// this class will
// search for the directory based on job provided
// create an output file output.js
// have that read by the job / notify it somehow through cli.
#include "../../lib/nlohmann/json.hpp"
#include <filesystem>
#include <string>

using nlohmann::json;
using std::string;

class FileCreator {
private:
  //  should store path based on job provided
  std::filesystem::path path;

  // valid init is based on the correct setup for GA

public:
  // looks for the job dir
  // checks input exists
  // creates output.json
  FileCreator(string path);
  // creates a json object based on the known input.json
  json inputJson();
  void outputJson(json outputJson);
};

#endif