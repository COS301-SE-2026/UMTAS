#include "GA.h"
#include "../../lib/openGA.hpp"
#include <string>
#include <unordered_map>

// used for short circuit of c(n)
int RequiredEvents = 0;

std::unordered_map<string, int> modulesMap;
std::unordered_map<string, int> tempMap;
// makes a key of module:event -> occurences
// also have a local structure that will do the same however its meant to be
// overwritten

EventChromosome copyChrom;
// this will be overwritten

GA_Handler::GA_Handler(API_DATA data) {
  this->initData = data;
  copyChrom = EventChromosome(data);
  InitMap();
  InitGA();
}
void GA_Handler::InitMap() {
  for (ModuleGA module : this->initData.modules) {
    for (auto &itr : modulesMap) {
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
  gaEngine.init_genes = init_genes;
  gaEngine.eval_solution = eval_solution;
  gaEngine.mutate = mutate;
  gaEngine.crossover = crossover;
  gaEngine.calculate_SO_total_fitness = calculate_SO_total_fitness;
  gaEngine.SO_report_generation = SO_report_generation;
  // init functions

  // DD setup
  gaEngine.problem_mode = EA::GA_MODE::SOGA;
  gaEngine.generation_max = 200;
  gaEngine.population = 100;
  gaEngine.multi_threading = true;
  gaEngine.crossover_fraction = 0.7;
  gaEngine.mutation_rate = 0.1;
  gaEngine.verbose = true;
}

EventChromosome GA_Handler::findSolution() {
  gaEngine.solve();
  int index = gaEngine.last_generation.best_chromosome_index;
  return gaEngine.last_generation.chromosomes[index].genes;
}

void init_genes(EventChromosome &p, const std::function<double(void)> &rnd01) {
  p = copyChrom;
  for (auto &event : p.events) {
    if (rnd01() >= 0.5) {
      event.is_active = true;
    }
  }
}

EventChromosome mutate(const EventChromosome &p,
                       const std::function<double(void)> &rnd01,
                       double shrink_scale) {
  int size = p.events.size();
  if (size > 0) {
    double mutatePer = 1 / (double)size;
    EventChromosome newChrom = p;

    for (int i = 0; i < newChrom.events.size(); i++) {
      if (rnd01() < mutatePer) {
        newChrom.events[i].is_active = !newChrom.events[i].is_active;
        if (newChrom.events[i].is_active) {
          newChrom.numActive++;
        } else {
          newChrom.numActive--;
        }
      }
    }
    return newChrom;
  } else {
    // fall back shouldnt happen
    return copyChrom;
  }
}

EventChromosome crossover(const EventChromosome &X1, const EventChromosome &X2,
                          const std::function<double(void)> &rnd01)

{

  EventChromosome child;

  child.events.resize(X1.events.size());
  float r = rnd01();
  int crossOverPt = r * child.events.size();

  if (crossOverPt == child.events.size()) {
    --crossOverPt;
  } else if (crossOverPt == 0) {
    ++crossOverPt;
  }
  int isActive = 0;
  for (int i = 0; i < child.events.size(); i++) {
    if (i < crossOverPt) {
      child.events[i].is_active = X1.events[i].is_active;
      if (child.events[i].is_active)
        isActive++;
    } else {
      child.events[i].is_active = X2.events[i].is_active;
      if (child.events[i].is_active)
        isActive++;
    }
  }
  child.numActive = isActive;
  return child;
}

bool eval_solution(const EventChromosome &p, ChromMiddleCost &c) {
  // this is our function that disallows non functioning solutions
  // May be useful may not be it depends
  // IF we only allow valid solutions -> GA may stall
  // IF we allow bad ones -> could mutate into good solution
  // CURRENT PLAN -> remove invalid ones being C(n) & P(n)
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
}

void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes) {}

bool CountPattern(EventChromosome chrom) {
  // C(n)
  if (RequiredEvents < chrom.numActive) {
    return false;
  }
  // P(n)

  for (EventGA event : chrom.events) {
    string key = event.moduleCode + ":" + event.eventType;

    tempMap[key]++;
    if (modulesMap[key] < tempMap[key]) {
      resetTemp();
      return false;
    }
  }
  return true;
}

void resetTemp() {
  for (auto &itr : tempMap) {
    itr.second = 0;
  }
}
