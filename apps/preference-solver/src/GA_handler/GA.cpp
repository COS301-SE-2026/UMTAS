#include "GA.h"
#include <cmath>
#include <iostream>
#include <ostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

// used for short circuit of c(n)
int RequiredEvents = 0;

std::unordered_map<string, int> modulesMap;
std::unordered_map<string, int> tempMap;
std::unordered_map<string, bool> collisionCheck;

// makes a key of module:event -> occurences
// also have a local structure that will do the same however its meant to be
// overwritten

EventChromosome copyChrom;
// this will be overwritten

GA_Handler::GA_Handler(API_DATA data) {
  this->initData = data;
  copyChrom = EventChromosome(data);
  InitMap();
  InitOverlap();
  InitGA();
}
void GA_Handler::InitOverlap() {
  std::vector<string> slots = slotEval(420, 1140);
  // 420 -> 7:00
  // 1140 -> 19:00
  std::vector<string> days = {"Monday", "Tuesday",  "Wednesday", "Thursday",
                              "Friday", "Saturday", "Sunday"};
  for (string day : days)
    for (auto &itr : slots) {
      collisionCheck.insert({day + ":" + itr, false});
    }
}
void GA_Handler::InitMap() {
  for (ModuleGA module : this->initData.modules) {
    for (auto &itr : module.number_Occur) {

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
  gaEngine.generation_max = 100;
  gaEngine.population = 100;
  gaEngine.multi_threading = false;
  gaEngine.crossover_fraction = 0.7;
  gaEngine.mutation_rate = 0.1;
  gaEngine.verbose = false;
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
      p.numActive++;
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

    newChrom.numActive = 0;
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
      child.events[i] = X1.events[i];
      if (child.events[i].is_active)
        isActive++;
    } else {
      child.events[i] = X2.events[i];
      if (child.events[i].is_active)
        isActive++;
    }
  }
  child.numCollision = 0;
  child.numActive = isActive;
  child.targetTime = X1.targetTime;
  return child;
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
      string key = event.moduleCode + ":" + event.eventType;

      tempMap.find(key)->second++;

      if (modulesMap[key] < tempMap[key]) {
        resetTemp();
        return false;
      }
    }
  }

  for (auto itr : tempMap) {
  
    if (itr.second != modulesMap[itr.first])
    {
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

  return Overlap_Heuristic(c.genes);
}
double Overlap_Heuristic(EventChromosome eventChrom) {

  int numberOfPts = 0;
  int target = eventChrom.targetTime;
  double sum = 0;
  for (EventGA event : eventChrom.events) {

    if (event.is_active) {
      numberOfPts++;
      std::vector<string> slots = slotEval(event.event_start, event.event_end);
      for (string slot : slots) {

        string eventKey = event.eventDay + ":" + slot;
        if (collisionCheck.find(eventKey)->second) {
          eventChrom.numCollision++;
        }
      }
      sum += std::fabs(event.event_start - target);
    }
  }

  double MAD = (1 / (double)numberOfPts) * sum;
  int collCount = eventChrom.numCollision;
  if (collCount == 0)
    return MAD;
  else
    return MAD * collCount;
}

std::vector<string> slotEval(int timeStart, int timeEnd) {
  // takes a time and puts it into the slots of the day listed from every 30
  // minutes.
  timeStart = roundDownSlot(timeStart);
  timeEnd = roundUpSlot(timeEnd);

  std::vector<string> slots;
  for (int time = timeStart; time < timeEnd; time += 30) {
    string timeKey = timeSlot(time);
    slots.push_back(timeKey);
  }
  return slots;
}

string timeSlot(int time) {
  std::stringstream hourSS;
  std::stringstream minSS;
  int hour = time / 60;
  int min = time % 60;
  hourSS << hour;
  minSS << min;
  return hourSS.str() + ":" + minSS.str();
}
int roundDownSlot(int time) {
  return (time / 30) * 30;
  // is int math
}
int roundUpSlot(int time) {
  return ((time + 29) / 30) * 30;
  // uses int math
}

void resetCollision() {
  for (auto &itr : collisionCheck) {
    itr.second = false;
  }
}
void SO_report_generation(
    int generation_number,
    const EA::GenerationType<EventChromosome, ChromMiddleCost> &last_generation,
    const EventChromosome &best_genes) {
  auto &bestChrom =
      last_generation.chromosomes[last_generation.best_chromosome_index];

  std::cout << "Generation " << generation_number << std::endl;
  std::cout << "Best fitness " << bestChrom.total_cost << std::endl;
  std::cout << "Collisions " << bestChrom.genes.numCollision << std::endl;
}
