#################################
Ownership Predicate Specification
#################################

***********
Overview
***********
The ownership predicate is the one of the simplest useful predicates.  It gives an address, specified as the ``state.data.owner`` , the ability to execute a state transition which changes any part of the owned subrange to a new ``StateObject`` by signing an approval transaction.

*************
Predicate API
*************

getOwner
========

.. code-block:: javascript

  {
        name: "getOwner",
        constant: true,
        inputs: [],
        outputs: [
            {
                name: "stateOwner",
                type: "address"
            }
        ]
  }

Description
-----------
The ``getOwner`` API method allows the client or operator to query the current owner of the state.

Inputs
------
N/A

Outputs
-------
1. `stateOwner` - `address`: the current owner based on the state object.  Will equal ``data.owner`` .

Justification
-------------

This function allows developers to get the owner without directly dissecting the state object.

send
========

.. code-block:: javascript

  {
        name: "send",
        constant: false,
        inputs: [
            {
                name: "newState",
                type: "StateObject"
            },
            {
                name: "targetBlock",
                type: "uint"
            }
        ],
        outputs: []
  }

Description
-----------
The ``send`` method is used to set the state to a new arbitrary state object, given a signature.

Inputs
------

1. ``newState`` - ``StateObject`` : the state object that the owner desires to mutate to.
2. ``targetBlock`` - ``uint`` : the maximum plasma block number for which the send is valid.

Outputs
-------
N/A

Justification
-------------

Being able to spend to any new state is the base property of ownership.  The ``targetBlock`` may be used to produce replay protection while allowing some level of asynchronicity between the client and operator.

***************************
State Object Specification
***************************

.. code-block:: python

  struct ownershipStateData:
    owner: address

Fields
======
1. `owner` - `address`: The Ethereum public address of the person who may mutate the state.

***********************************
Additional Predicate Contract Logic
***********************************

N/A

*******************
Predicate Interface
*******************

Transition Execution
====================

.. code-block:: python
  
  def verifyStateTransition(preState: StateUpdate, input: StandardTransaction, witness: bytes postState: StateUpdate)

Requirements
------------

1. **MUST** ensure that the ``input.witness`` is a signature by the ``preState.stateObject.owner`` .
2. **MUST** ensure that the ``postState.range`` is the same as ``input.start`` and ``input.end`` .
3. **MUST** ensure that the ``input.parameters.newState`` is the same as the ``postState.state`` .
3. **MUST** ensure that the ``input.parameters.targetBlock`` is greater than or equal to the ``postState.plasmaBlockNumber`` .

Rationale
---------

The addition of limbo exits has removed the need to always specify a target block number which is one more than the client's currently verified block.  Thus, we can allow transactions to be in flight for multiple blocks with this predicate.

Exit Finalization
------------------

.. code-block:: python

  def onExitGameFinalized(exit: Checkpoint, witness: myExitabilityWitness)

Requirements
^^^^^^^^^^^^

1. **MUST** Send the total balance of the subrange to the ``exit.stateUpdate.state.owner`` .

Rationale
^^^^^^^^^

Exit Permission
---------------

.. code-block:: python
  
  def canStartExitGame(exit: Checkpoint, witness: myExitabilityWitness)

Requirements
^^^^^^^^^^^^

1. **MUST** require via the ``witness`` or ``tx.sender`` that the person exiting is the same as ``exit.stateUpdate.state.data.owner`` .

Rationale
^^^^^^^^^

Exit Lockup
-----------

.. code-block:: python

  def getAdditionalExitPeriod(exit: Checkpoint, witness: myExitabilityWitness) -> uint256

Requirements
^^^^^^^^^^^^
1. Return 0.

Rationale
^^^^^^^^^
No additonal lockup is required for safety.

*******************
Verification Plugin
*******************

State Transitions
=================

.. code-block:: python
  
  def executeStateTransition(preState: StateUpdate, transaction: StandardTransaction)

Requirements
------------
1. **MUST** ensure that the ``transaction.witness`` is a signature by the ``preState.stateObject.owner`` .
2. **MUST** return a ``StateUpdate`` with a range the same as ``transaction.start`` and ``transaction.end`` .
3. **MUST** return a ``StateUpdate`` with ``state`` is the same as the ``transaction.parameters.newState`` .
4. **MUST** ensure that the ``transaction.parameters.targetBlock`` is greater than or equal to the pending plasma block number .

Rationale
---------
These steps always produce a ``StateUpdate`` which passes the predicate contract's ``verifyStateTransition`` step.

***************
Guarding Plugin
***************

TODO
