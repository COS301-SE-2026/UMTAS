#include "GA.h"
#include "../heuristic/Decorators/Decorators.h"
#include <algorithm>
#include <cmath>
#include <iostream>
#include <ostream>
#include <unordered_map>
#include <vector>
// used for short circuit of c(n)
int RequiredEvents = 0;

std::unordered_map<string, int> modulesMap;
std::unordered_map<string, int> tempMap;
std::unordered_map<string, eventsOccurring> mutationMap;
BaseHeuristic *Heuristics = nullptr;

string requirementKey(const EventGA &event) {
  return event.moduleCode + ":" + event.activityCode;
}

EventChromosome copyChrom;

namespace {
bool eventsOverlap(const EventGA &left, const EventGA &right) {
  return left.dayOfWeek == right.dayOfWeek &&
         left.event_start < right.event_end &&
         right.event_start < left.event_end;
}

int countConflicts(const EventChromosome &candidate) {
  int conflicts = 0;
  for (size_t left = 0; left < candidate.events.size(); ++left) {
    if (!candidate.events[left].is_active)
      continue;
    for (size_t right = left + 1; right < candidate.events.size(); ++right) {
      if (candidate.events[right].is_active &&
          eventsOverlap(candidate.events[left], candidate.events[right])) {
        ++conflicts;
      }
    }
  }
  return conflicts;
}
} // namespace

GA_Handler::GA_Handler(API_DATA data, bool optimize) : optimize(optimize) {
  this->initData = data;
  RequiredEvents = 0;
  modulesMap.clear();
  tempMap.clear();
  mutationMap.clear();
  copyChrom = EventChromosome(data);
  InitMap();
  InitMutationMap();
  if (data.decorators) {
    Heuristics = data.decorators;
    // no uneeded dups
    data.decorators = nullptr;
  }

  hasSufficientAlternatives = HasSufficientAlternatives();
  InitGA();
}
void GA_Handler::InitMap() {
  for (ModuleGA module : this->initData.modules) {
    for (auto &itr : module.requiredSelections) {

      string key = module.moduleCode + ":" + itr.first;
      // key events can easily access
      int val = itr.second;
      // used for easy short circuit of C(n)
      RequiredEvents += val;

      modulesMap.insert({key, val});
      tempMap.insert({key, 0}); // will be be changed individually.
    }
  }
}
void GA_Handler::InitGA() {

  // init functions
  gaEngine.init_genes = optimize ? init_genes : init_genes_randomized;
  gaEngine.eval_solution = eval_solution;
  gaEngine.mutate = mutate;
  gaEngine.crossover = crossover;
  gaEngine.calculate_SO_total_fitness =
      optimize ? calculate_SO_total_fitness : calculate_conflict_total_fitness;
  gaEngine.SO_report_generation = SO_report_generation;
  // init functions

  // DD setup
  gaEngine.problem_mode = EA::GA_MODE::SOGA;
  gaEngine.generation_max = 50;
  gaEngine.population = 50;
  gaEngine.multi_threading = false;
  gaEngine.crossover_fraction = 0.7;
  gaEngine.mutation_rate = 0.9;
  gaEngine.verbose = false;
}

EventChromosome GA_Handler::findSolution() {
  if (!hasSufficientAlternatives)
    return copyChrom;
  if (copyChrom.events.empty())
    return copyChrom;
  std::cout << "Starting GA" << std::endl;
  gaEngine.solve();
  int index = gaEngine.last_generation.best_chromosome_index;
  return gaEngine.last_generation.chromosomes[index].genes;
}

void init_genes(EventChromosome &p, const std::function<double(void)> &rnd01) {
  p = copyChrom;
  for (EventGA &event : p.events) {
    string key = requirementKey(event);
    if (modulesMap[key] > tempMap[key]) {
      tempMap.find(key)->second++;
      event.is_active = true;
      p.numActive++;
    }
  }
  resetTemp();
}

void init_genes_randomized(EventChromosome &p,
                           const std::function<double(void)> &rnd01) {
  p = copyChrom;
  for (EventGA &event : p.events)
    event.is_active = false;
  p.numActive = 0;
  p.numCollision = 0;

  for (const auto &[key, group] : mutationMap) {
    const auto requirement = modulesMap.find(key);
    if (requirement == modulesMap.end())
      continue;

    std::vector<int> indices = group.indices;
    for (size_t remaining = indices.size(); remaining > 1; --remaining) {
      const size_t selected =
          static_cast<size_t>(rnd01() * remaining) % remaining;
      std::swap(indices[selected], indices[remaining - 1]);
    }

    const size_t selectionCount =
        std::min(indices.size(), static_cast<size_t>(requirement->second));
    for (size_t index = 0; index < selectionCount; ++index) {
      p.events[indices[index]].is_active = true;
      ++p.numActive;
    }
  }
}

EventChromosome mutate(const EventChromosome &p,
                       const std::function<double(void)> &rnd01,
                       double shrink_scale) {
  int size = p.events.size();
  EventChromosome nChrom = p;
  if (size == 0)
    return nChrom;
  const int index = (int)(std::floor(rnd01() * 1000)) % size;
  const auto group = mutationMap.find(requirementKey(nChrom.events[index]));
  if (group == mutationMap.end())
    return nChrom;

  std::vector<int> activeIndices;
  std::vector<int> inactiveIndices;
  for (const int eventIndex : group->second.indices) {
    (nChrom.events[eventIndex].is_active ? activeIndices : inactiveIndices)
        .push_back(eventIndex);
  }
  if (activeIndices.empty() || inactiveIndices.empty())
    return nChrom;

  const auto choose = [&rnd01](const std::vector<int> &indices) {
    return indices[static_cast<size_t>(rnd01() * indices.size()) %
                   indices.size()];
  };
  nChrom.events[choose(activeIndices)].is_active = false;
  nChrom.events[choose(inactiveIndices)].is_active = true;
  return nChrom;
}
void GA_Handler::InitMutationMap() {
  for (int i = 0; i < copyChrom.events.size(); i++) {
    mutationMap[requirementKey(copyChrom.events[i])].indices.push_back(i);
  }
}

bool GA_Handler::HasSufficientAlternatives() const {
  for (const auto &[requirement, requiredSelections] : modulesMap) {
    const auto alternatives = mutationMap.find(requirement);
    const size_t available = alternatives == mutationMap.end()
                                 ? 0
                                 : alternatives->second.indices.size();
    if (requiredSelections < 0 ||
        available < static_cast<size_t>(requiredSelections)) {
      return false;
    }
  }
  return true;
}

EventChromosome crossover(const EventChromosome &X1, const EventChromosome &X2,
                          const std::function<double(void)> &rnd01)

{
  // needs to be rewritten optimised for smart crossover
  return X1;
}

bool eval_solution(const EventChromosome &p, ChromMiddleCost &c) {
  // this is our function that disallows non functioning solutions
  // May be useful may not be it depends
  // IF we only allow valid solutions -> GA may stall
  // IF we allow bad ones -> could mutate into good solution
  // CURRENT PLAN -> remove invalid ones being C(n) & P(n)
  return CountPattern(p);
  // we dont need middle cost
}
bool CountPattern(EventChromosome chrom) {
  // C(n)
  if (RequiredEvents != chrom.numActive) {
    return false;
  }

  // P(n)
  for (EventGA event : chrom.events) {

    if (event.is_active) {
      string key = requirementKey(event);

      tempMap.find(key)->second++;

      if (modulesMap[key] < tempMap[key]) {
        resetTemp();
        return false;
      }
    }
  }

  for (auto itr : tempMap) {

    if (itr.second != modulesMap[itr.first]) {
      resetTemp();
      return false;
    }
  }

  resetTemp();
  return true;
}

void resetTemp() {
  for (auto &itr : tempMap) {
    itr.second = 0;
  }
}

double calculate_SO_total_fitness(
    const EA::ChromosomeType<EventChromosome, ChromMiddleCost> &c) {
  // this is our heuristic
  // O(n) & V(n)
  // V(n) -> gives us the actual heuristic
  // O(n) -> decreases value based on number of conflicts

  // IDEA
  // V(n) -> gives a double
  // O(n) -> gives an int for number of collisions
  // O(n) * V(n) -> higher score
  // This function in GA minimises.

  double heuristicValue = 0;
  if (Heuristics)
    Heuristics->calculateHeursitic(c.genes);

  return heuristicValue + Overlap_Heuristic(c.genes);
}

double calculate_conflict_total_fitness(
    const EA::ChromosomeType<EventChromosome, ChromMiddleCost> &c) {
  return countConflicts(c.genes);
}

double Overlap_Heuristic(EventChromosome eventChrom) {

  return (countConflicts(eventChrom) * 10000.0);
}
void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes) {
  auto &bestChrom =
      last_generation.chromosomes[last_generation.best_chromosome_index];

  std::cout << "Generation " << generation_number << std::endl;
  std::cout << "Best fitness " << bestChrom.total_cost << std::endl;
  std::cout << "Number of collisions " << countConflicts(bestChrom.genes)
            << std::endl;
}

GA_Handler::~GA_Handler() {
  if (Heuristics)
    delete Heuristics;
}
