#include <vector>
#include "Coalition.h"
#include "Party.h"

class party;

//constructor
Coalition::Coalition(int partyId,int numOfM): mMandates(),col() {
    mMandates = numOfM;
    col.push_back(partyId);
}

 vector<int> &Coalition::getCoalitionVector(){
    return col;
}

int Coalition::getNumMandates()const{
    return mMandates;
}

const void Coalition::addToCoaltion(int partyId, int numOfM) {
    col.push_back(partyId);
    mMandates = mMandates + numOfM;
}