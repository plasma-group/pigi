###################
Predicate Contracts
###################

***********
Description
***********
Predicate contracts define the rules for particular state objects' exit game.  The most fundamental thing they define is the deprecation  logic, which informs the plasma contract that an exit on some state is invalid because it is outdated. Usually, this logic revolves around proving to the predicate that some transaction has invalidated a previous exit.  Because the predicate contract is a stateful main-chain contract, more advanced predicates can also define custom exit logic which must be evaluated before any state transitions are approved by the predicate.  Thus, predicates can be used as fully customized extensions to the base plasma cash exit game.

-------------------------------------------------------------------------------

***********
Deprecation
***********

The foremost thing a predicate accomplishes is to enable the deprecation of its state, so that a new state included by the operator becomes valid.  This enables state transitions to occur. Because the deposit contract only allows an exit's ``predicateAddress`` to call ``deprecateExit``, the predicate must enable some function which leads to a subcall on ``depositContract.deprecateExit``.

***************
Exit Initiation
***************

Just like the ``msg.sender`` check by the deposit contract for deprecations, only the predicate is allowed to begin an exit for a given checkpoint.  Thus, the predicate must provide some method which leads to a subcall on ``depositContract.beginExit``. This enables the predicate to prevent unwanted exits, e.g. by only allowing the current owner to start an exit.

*****************
Exit Finalization
*****************

If the predicate contract has custom/stateful exit logic, it may not know who to send money to even after the standard plasma exit period has elapsed.  Thus, we require that the ``msg.sender == predicateAddress`` for a given exit to be finalized and funds to be released.  This requires a call by the predicate to the ``depositContract.finalizeExit``.

-------------------------------------------------------------------------------

These are the only real requirements for a predicate contract to be compatible with the deposit contract spec.  However,  it lacks a useful abstraction usually made by blockchains and plasma implementations: the notion of transactions and state transitions.  In the next section, we define a standard predicate baase which is used throughout the rest of the spec, that treats deprecations, exits, etc. in terms of transactions and state transitions.

