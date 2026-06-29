#include <string>
#include <iostream>
#include <vector>
#include "types.h"
#include <unordered_map>

using std::cout;
using std::endl;
using std::string;

class GA_PREF
{
private:
    int targetTime;
    std::unordered_map<string, int> numOccurences;
    EventChromosome copyChromosome;
    // finds how many times module code should occcur

public:
    GA_PREF(GA_Data &data);

private:
    bool setModuleData(std::vector<ModuleGA> modules);
    bool CreateEventChromosome(std::vector<EventGA> events);
};