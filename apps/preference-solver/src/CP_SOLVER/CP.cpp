#include "CP.h";

//Constr
CP_SOLVER::CP_SOLVER(API_DATA& data):
    inputData(data), modules(data.modules), events(data.events){

    //Create bool vector for events
    this->selectEvent = this->createSelectEventVector(data.events);
};

//createSelectEventVector
std::vector<BoolVar> CP_SOLVER::createSelectEventVector(const std::vector<EventGA>& inVec){

    //Define and reserve for output vector
    std::vector<BoolVar> out;
    out.reserve(inVec.size());

    //Initialise output vecotr to OR's bools
    for (int i=0; i<inVec.size(); i++)
        out.push_back(model.NewBoolVar());

    return out;
};//END_createSelectEventVector

//Create + assign rules to model
void CP_SOLVER::createRules(){

    //Each event needs to be selected numOccurance of times - not more not less :)
    occuranceRule();

    //No overlaps of events on the same day


};//END_createRules


//🎅's little helpers

//Return true if the times overlap
bool timeOverlap(const int start1, const int end1, const int start2, const int end2){

    //Time is an int of minutes from 00:00
    // if (end1<)


    return ((start2>=start1 && end2<=end1));
};//END_timeOverlap

//RULE HELPERTJIES
//occuranceRules
void CP_SOLVER::occuranceRule() {
    //Ja dis n vreemde een

    //For each module in modules array
        //For each event type for module
            //see how many times this module's eventType occured

    for (const auto& module : modules){

        for (const auto& [type, numOccur] : module.number_Occur){

            //How many times does this eventTYpe for this module occur - used for actual rule
            std::vector<BoolVar> vars;

            //Loop through the events vector
            //if its the module + type being considered -> cross check with the selectedEvents vector to count occurances
            for (int i=0; i<events.size(); i++){

                if (events[i].moduleCode==module.moduleCode && events[i].eventType==type)
                    vars.push_back(selectEvent[i]);
            }//END_i

            //Add rule to module for this eventtype for this module
            //Are the amount of event options chosen for this event type for this module equal to the amount it should be
            model.AddEquality(LinearExpr::Sum(vars), numOccur);
        }//END_type
    }//END_module
};//END_occuranceRule

//overlapRule
void CP_SOLVER::overlapRule() {

    //any two events that happen at the same time on the same day cannot both be chosen

    for (int i=0; i<events.size(); i++){
        for (int j=0; j<events.size(); j++){

            //check if events overlap -> day | time
            // if ((events[i].eventDay==events[j].eventDay) && ())
        }//END_j
    }//END_i

};//END_overlapRule


















