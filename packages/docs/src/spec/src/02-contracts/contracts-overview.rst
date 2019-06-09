###################
Contracts Overview
###################

************
Introduction
************

The PG contract architecture consists of three modular components which serve as the basis for creating plasma networks. These are:

Commitment contracts - where aggregators submit blocks, and where deposit contracts verify inclusion of State Updates.
Deposit contracts - where users deposit money. Enforces the basic plasma exit game to guarantee safety.
Predicate contracts - communicate with the deposit contract to extend the basic plasma exit game for particular applications (plapps).

Commitment Contract
===================

The commitment contract defines a single public address aggregatorwhich can submit new blocks, and records the blocks in storage for later use. It also provides two functions, verifyAssetStateRootInclusion and verifyStateUpdateInclusion, which may be used by both the predicate and deposit contracts to authenticate block contents.


Deposit Contract
================

The deposit contract contains the base plasma logic for keeping funds secure. It allows users to deposit funds into it, and only allows withdrawals after an “exit game” has been passed. It provides a standard interface which predicate contracts may access to enforce their particular exit game details.

Predicate Contracts
===================

Predicate contracts implement the specific logic of an exit game, and by extent define the transition logic for that type of state object. Most importantly, they dictate the rules of deprecation – the conditions by which an exit on the given state can be cancelled. For example, the ownership predicate allows an exit to be deprecated if the exiting owner has made a signature sending to another party.

****************
Deposit Contract
****************

The deposit contract custodies users’ funds and enforces the plasma cash exit game on them. The exit game we have chosen is a modification of the exit games first proposed by Lucidity (https://ethresear.ch/t/luciditys-plasma-cash-easy-and-more-efficient/4029/8) and Dan Robinson (https://ethresear.ch/t/a-simpler-exit-game-for-plasma-cash/4917) to work on ranges of coins (cashflow).

Coin Fork Choice Rule
=====================

The simplest way to understand the rules the exit game enforces are as follows: for a given coin, the exitable state is that of its earliest state update which cannot be deprecated.

Thus, there are two conditions which a particular state update on a particular must satisfy to be exited. First, it must have no undeprecated state updates in its history. Second, it must itself not be deprecated. We have split these conditions into two distinct games.

Exits
=====

Exits are the game for the second condition above: they represent a claim that some subrange of a state update is not deprecated. At any time, the predicate contract for that state update is allowed to make a call, deprecateExit, which cancels it. Only the predicate for that state update is authenticated to make the call. An exit points at a particular checkpoint.

Checkpoints
===========

Checkpoints are the game for the first condition above: they represent a claim that all prior state updates must be deprecated for the range being exited. Finalization of a checkpoint means that the contract will strictly enforce this, disallowing any exits on a coin which come from an earlier plasma block in which a checkpoint on that coin is finalized.

Challenges
==========

Creating a checkpoint on a state object requires an inclusion proof for a state update over that object. As such, if a state update is included by the aggregator without a previous state being deprecable, this is a malicious action which forces the user to exit. If the aggregator begins a checkpoint on the malicious state update, it may be blocked by a challenge. A challenge points at the earlier exit and a later intersecting checkpoint. That checkpoint is considered invalid unless the earlier exitobject can be deprecated, removing the challenge.
