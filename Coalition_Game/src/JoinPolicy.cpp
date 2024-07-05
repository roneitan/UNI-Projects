#include "JoinPolicy.h"
#include <iostream>
#include <string>
#include <vector>
#include "Coalition.h"
#include "Simulation.h"

using std::string;
using std::vector;
class JoinPolicy;

 void MandatesJoinPolicy::chooseCol(vector<int> offers,Party &p,Simulation &s){
    vector<Agent> allAgents = s.getAgents();
    Agent best = allAgents.at(offers.back());
    offers.pop_back();
    int numOfM = s.getCoalitionById(best.getCoalitionId()).getNumMandates();
    while(!offers.empty()){
        Agent curr = allAgents.at(offers.back());
        if(s.getCoalitionById(curr.getCoalitionId()).getNumMandates() >= numOfM){
            best = curr;
        }
        offers.pop_back();
    }
    s.acceptOffer(best.getId(),p.getId());
};

void LastOfferJoinPolicy::chooseCol(vector<int> req,Party &p,Simulation &s){
    int bestId = req.back();
    s.acceptOffer(bestId,p.getId());
}

JoinPolicy* MandatesJoinPolicy::cloneMe(){
    JoinPolicy* pol = new MandatesJoinPolicy(*this);
    return pol ;
}

JoinPolicy* LastOfferJoinPolicy::cloneMe(){
    JoinPolicy* pol = new LastOfferJoinPolicy(*this);
    return pol;
}