#include "pref.h"

GA_PREF::GA_PREF(GA_Data &data)
{
    this->targetTime = data.targetTime;
    try
    {
        setModuleData(data);
    }
    catch (const std::exception &e)
    {
        std::cerr << e.what() << '\n';
    }
}

bool GA_PREF::setModuleData(GA_Data &data)
{
    for (const ModuleGA &module : data.modules)
    {
        if (numOccurences.find(module.moduleCode) != numOccurences.end())
        {
            throw std::runtime_error("Failed to set number of occurences, module " + module.moduleCode + " is listed twice");
        }
        else
        {
            numOccurences.insert({module.moduleCode, module.number_Occur});
        }
    }
}