#include "CP.h"

//Constr
CP_SOLVER::CP_SOLVER(API_DATA& data):
    inputData(data), modules(data.modules), events(data.events){

    //Create bool vector for events
    this->selectEvent = this->createSelectEventVector(data.events);

    //Create rules for solver
    createRules();
};

//Create + assign rules to model
void CP_SOLVER::createRules(){

    //Each event needs to be selected numOccurance of times - not more not less :)
    occuranceRule();

    //No overlaps of events on the same day
    overlapRule();
};//END_createRules

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

//applySolution
std::vector<EventGA> CP_SOLVER::applySolution(const std::vector<bool>& boolVec){

    std::vector<EventGA> out;

    for (int i=0; i<boolVec.size(); i++)
        if (boolVec[i]) 
            out.push_back(events[i]);

    return out;
};//END_applySolution

//========== Solving
std::vector<EventGA> CP_SOLVER::solve(){
    // Run the solver
    CpSolverResponse response = Solve(model.Build());

    std::cout<<"Solve: "<<std::endl;

    // Check if solution found
    if (response.status()==CpSolverStatus::OPTIMAL ||
        response.status()==CpSolverStatus::FEASIBLE) {

        std::cout << "Solution found!" << std::endl;

        //SImple bool vector to get events selected
        std::vector<bool> boolVec;
        boolVec.reserve(selectEvent.size());

        //iterate through selectedEvents and get selected events
        for (int i=0; i<selectEvent.size(); i++) {

            bool chosen = SolutionBooleanValue(response, selectEvent[i]);
            boolVec.push_back(chosen);
            std::cout<<"Event "<<i<<" chosen? "<<chosen<<std::endl;
        }//END_i

        // Convert bool vector into actual events
        return applySolution(boolVec);
    } else {
        std::cout << "No solution found." << std::endl;
        return {};
    }//END_if-else
};//END_solve


//🎅's little helpers

//Return true if the times overlap
bool timeOverlap(const int start1, const int end1, const int start2, const int end2){

    //Time is an int of minutes from 00:00
    return (start1 < end2) && (start2 < end1);
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
        for (int j=i+1; j<events.size(); j++){

            const auto& event1 = events[i];
            const auto& event2 = events[j];

            //check if events overlap -> day | time
            if (
                (event1.eventDay==event2.eventDay) && 
                (timeOverlap(event1.event_start, event1.event_end, event2.event_start, event2.event_end))
            ) model.AddBoolOr({selectEvent[i].Not(), selectEvent[j].Not()});
        }//END_j
    }//END_i
};//END_overlapRule


















