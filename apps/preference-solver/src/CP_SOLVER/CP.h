#pragma once

#include "../data/GA-data/chromosome.h"

#include "ortools/sat/cp_model.h"

class CP_SOLVER {
 private:
  API_DATA inputData;
  operations_research::sat::CpModelBuilder model;
  std::vector<operations_research::sat::BoolVar> selectedEvents;

  void createRules();
  void selectionRules();
  void overlapRules();
  void objectiveRule();

 public:
  explicit CP_SOLVER(const API_DATA &data);
  EventChromosome solve();
};
