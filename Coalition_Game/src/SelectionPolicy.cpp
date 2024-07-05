#include "SelectionPolicy.h"
#include <vector>
#include "Party.h"
#include "Simulation.h"

class Simulation;
class Party;


void MandatesSelectionPolicy::makeOffer(Agent &me,Simulation &s){
    const Graph* g = &(s.getGraph());
    int bestM = 0;
    int bestId = -1;
    for (int i : g->getNeighbors(me.getPartyId())){
        Party p = g->getParty(i);
        if (!(p.getState() == Joined)){
            if(isItFirstOffer(me,p,s)){
                if(p.getMandates() > bestM){
                bestId = p.getId();
                }
            }
        }
    }
    if(bestId != -1){
        Party best = g->getParty(bestId);
        best.submitAnOffer(me.getId());
        best.setState(CollectingOffers);
    }
}

void EdgeWeightSelectionPolicy::makeOffer(Agent &me,Simulation& s){
    int mine = me.getPartyId();
    const Graph* g = &(s.getGraph());
    int bestE = 0;
    int bestId = -1;
    for (int i : g->getNeighbors(me.getPartyId())){
        Party p = g->getParty(i);
        if ((p.getState() != Joined)){
            if(g->getEdgeWeight(mine,p.getId()) > bestE){
                if(isItFirstOffer(me,p,s)){
                    bestId = p.getId();
                    bestE = g->getEdgeWeight(mine,p.getId());
                }
            }
        }
    }
    if(bestId != -1){
        s.sendOffer(bestId,me.getId());
    }
}

bool SelectionPolicy::isItFirstOffer(Agent &me, Party &p,Simulation &s) const{
    vector<int> offers = p.getOffers();
    vector<Agent> allAgent = s.getAgents();
    for (int id : offers){
        if(allAgent.at(id).getCoalitionId() == me.getCoalitionId()){
            return false;
        }
    }
    return true;
}

SelectionPolicy* MandatesSelectionPolicy::cloneMe(){
    MandatesSelectionPolicy* pol = new MandatesSelectionPolicy;
    return pol;
}

SelectionPolicy* EdgeWeightSelectionPolicy::cloneMe(){
    EdgeWeightSelectionPolicy* pol = new EdgeWeightSelectionPolicy;
    return pol;
}
