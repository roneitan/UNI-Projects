#include "Agent.h"
#include "Coalition.h"
#include "Graph.h"
#include "SelectionPolicy.h"
#include "Simulation.h"

Agent::Agent(int agentId, int partyId, SelectionPolicy *selectionPolicy) : mAgentId(agentId), mPartyId(partyId), mSelectionPolicy(selectionPolicy),
mColId()
{
    // You can change the implementation of the constructor, but not the signature!
}

//destructor    
Agent::~Agent(){
    delete mSelectionPolicy;
}

//copy constructor
Agent::Agent(const Agent& other): mAgentId(other.mAgentId), mPartyId(other.mPartyId), mSelectionPolicy(other.mSelectionPolicy->cloneMe()),
mColId(other.mColId){
   
}

//copy assignment operator
Agent& Agent::operator=(const Agent& other){
    if (this != &other){
        mAgentId = other.mAgentId;
        mPartyId = other.mPartyId;
        *mSelectionPolicy = *other.mSelectionPolicy;
        mColId = other.mColId;
    }
    return *this;
}

//move constructor
Agent::Agent(Agent&& other) noexcept : mAgentId(other.mAgentId), mPartyId(other.mPartyId), mSelectionPolicy(other.mSelectionPolicy),
mColId(other.mColId) 
{
    other.mSelectionPolicy = nullptr;
}

//move assignment operator
Agent& Agent::operator=(Agent&& other) noexcept{
    if (this != &other){
        delete this->mSelectionPolicy;
        mAgentId = other.mAgentId;
        mColId = other.mColId;
        mPartyId = other.mPartyId;
        mSelectionPolicy = other.mSelectionPolicy;
        other.mSelectionPolicy = nullptr;
    }
    return *this;
}

int Agent::getId() const
{
    return mAgentId;
}

int Agent::getPartyId() const
{
    return mPartyId;
}

void Agent::step(Simulation &sim)
{
    mSelectionPolicy->makeOffer(*this,sim);
}


void Agent::setPartyId(int id){
    mPartyId = id;
}

void Agent::setId(int id){
    mAgentId = id;
}

int Agent:: getCoalitionId()const{
    return mColId;
}

void Agent:: setCol(int colId){
    mColId = colId;
}