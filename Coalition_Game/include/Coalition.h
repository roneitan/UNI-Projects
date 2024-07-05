#pragma once

#include <vector>
#include "Party.h"
#include "Graph.h"


class Party;
using std::vector;

class Coalition
{

public:
    Coalition(int partyId,int numOfM);
    vector <int> &getCoalitionVector();
    int getNumMandates() const;
    const void addToCoaltion(int partyId, int numOfM);

private:
    int mMandates;
    vector<int> col;
};

