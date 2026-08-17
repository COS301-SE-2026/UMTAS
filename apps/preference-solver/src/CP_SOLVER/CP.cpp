#include "CP.h"

#include "../heuristic/Decorators/Decorators.h"
#include "ortools/sat/cp_model_solver.h"
#include <cstdlib>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace {

std::string requirementKey(const EventGA &event) {
  return event.moduleCode + ":" + event.activityCode;
}

} // namespace

CP_SOLVER::CP_SOLVER(const API_DATA &data, bool optimize) : inputData(data) {
  selectedEvents.reserve(inputData.events.size());
  for (size_t index = 0; index < inputData.events.size(); ++index) {
    selectedEvents.push_back(model.NewBoolVar());
  }
  selectionRules();
  overlapRules();
  if (optimize)
    objectiveRule();
}

void CP_SOLVER::createRules() {
  selectionRules();
  overlapRules();
  objectiveRule();
}

void CP_SOLVER::selectionRules() {
  using operations_research::sat::BoolVar;
  using operations_research::sat::LinearExpr;

  std::unordered_map<std::string, std::vector<BoolVar>> selectionsByRequirement;
  for (size_t index = 0; index < inputData.events.size(); ++index) {
    selectionsByRequirement[requirementKey(inputData.events[index])].push_back(
        selectedEvents[index]);
  }

  EventChromosome chromosome(inputData);
  for (const auto &[requirement, required] : chromosome.requiredSelections) {
    model.AddEquality(LinearExpr::Sum(selectionsByRequirement[requirement]),
                      required);
  }
  for (const auto &[requirement, selections] : selectionsByRequirement) {
    if (chromosome.requiredSelections.find(requirement) ==
        chromosome.requiredSelections.end()) {
      model.AddEquality(LinearExpr::Sum(selections), 0);
    }
  }
}

void CP_SOLVER::overlapRules() {
  using operations_research::sat::IntervalVar;

  std::unordered_map<std::string, std::vector<IntervalVar>> intervalsByDay;
  for (size_t index = 0; index < inputData.events.size(); ++index) {
    const EventGA &event = inputData.events[index];
    intervalsByDay[event.dayOfWeek].push_back(
        model.NewOptionalFixedSizeIntervalVar(
            event.event_start, event.event_end - event.event_start,
            selectedEvents[index]));
  }
  for (const auto &[day, intervals] : intervalsByDay) {
    model.AddNoOverlap(intervals);
  }
}

void CP_SOLVER::objectiveRule() {
  using operations_research::sat::LinearExpr;

  EventChromosome heuristicChrom(inputData);

  LinearExpr objective;
  if (inputData.decorators)
    objective += inputData.decorators->calculateHeursitic(heuristicChrom);
  model.Minimize(objective);
}
// works towards 7:30 temp solution
EventChromosome CP_SOLVER::solve() {
  using operations_research::sat::CpSolverResponse;
  using operations_research::sat::CpSolverStatus;

  EventChromosome result(inputData);
  const CpSolverResponse response =
      operations_research::sat::Solve(model.Build());
  switch (response.status()) {
  case CpSolverStatus::INFEASIBLE:
    return result;
  case CpSolverStatus::MODEL_INVALID:
    throw std::runtime_error("CP-SAT rejected an invalid model");
  case CpSolverStatus::UNKNOWN:
    throw std::runtime_error(
        "CP-SAT stopped before proving feasibility or infeasibility");
  case CpSolverStatus::OPTIMAL:
  case CpSolverStatus::FEASIBLE:
    break;
  default:
    throw std::runtime_error("CP-SAT returned an unrecognized solver status");
  }

  for (size_t index = 0; index < selectedEvents.size(); ++index) {
    result.events[index].is_active =
        operations_research::sat::SolutionBooleanValue(response,
                                                       selectedEvents[index]);
    if (result.events[index].is_active)
      ++result.numActive;
  }
  return result;
}
