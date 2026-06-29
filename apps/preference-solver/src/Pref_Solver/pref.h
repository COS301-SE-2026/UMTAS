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
public:
    GA_PREF();

private:
    static std::unordered_map<string, int> &setModuleData(const std::vector<ModuleGA> &modules);
    static EventChromosome &CreateEventChromosome(std::vector<EventGA> &events);
    static EventChromosome StartGA(GA_DATA &data);
};