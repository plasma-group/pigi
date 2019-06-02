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
                name: "originBlock",
                type: "uint"
            },
            {
                name: "maxBlock",
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
2. ``originBlock`` - ``uint`` : the maximum plasma blocknumber of the ownership ``StateUpdate`` s from which you are spending.
3. ``maxBlock`` - ``uint`` : the maximum plasma block number for which the send is valid.

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

**************************
Additional Exit Game Logic
**************************

N/A

************************
Predicate Contract Logic
************************

Transition Execution
====================

.. code-block:: python
  
  def verifyTransaction(preState: StateUpdate, transaction: Transaction, witness: bytes postState: StateUpdate)

Requirements
------------

1. **MUST** ensure that the ``witness`` is a signature by the ``preState.stateObject.owner`` on the ``transaction``.
2. **MUST** ensure that the ``preState.plasmaBlockNumber`` is less than the ``input.parameters.originBlock`` .
3. **MUST** ensure that the ``postState.range`` is the same as ``transaction.start`` and ``transaction.end`` .
4. **MUST** ensure that the ``transaction.parameters.newState`` is the same as the ``postState.state`` .
5. **MUST** ensure that the ``input.parameters.targetBlock`` is greater than or equal to the ``postState.plasmaBlockNumber`` .

Rationale
---------
These conditions allow a signature by the sender to approve only a single output state.

Exit Finalization Logic
-----------------------

.. code-block:: python

  def onFinalizeExit(owner: address, ERC20Contract: address, amount: uint256)
  
Parameters
^^^^^^^^^^
1. ``owner`` - ``address``: the owner of the exit.
2. ``ERC20Contract`` - ``address``: The ERC20 contract the ownership is of.
3. ``amount`` - ``uint256``: the amount of the ERC20 token being redeemed.

  
Description
^^^^^^^^^^^
This function is called internally by the predicate when it needs to handle an exit, whether as a limbo target or as a regular exit.

Requirements
^^^^^^^^^^^^

1. **MUST** only allow this method to be called internally.
2. **MUST** Send the total ``amount`` to the ``owner`` .

Rationale
^^^^^^^^^
The owner of a range gets all of the assets it corresponds to.

****************
Limbo Exit Logic
****************
As with all predicates in this spec, the ownership predicate supports limbo exit functionality.  As such, it **MUST** fulfill all the methods and requirements outlined in the limbo standard outlined in the contracts section of this spec.  Additional requirements for some of the methods in this predicate are shown below.  They are quite simple as the ownership predicate is mostly pure functions.


onTargetedForLimboExit
----------------------

.. code-block:: solidity

   function onTargetedForLimboExit(
       Checkpoint _sourceExit,
       StateUpdate _limboTarget
   ) public


Additonal Requirements
^^^^^^^^^^^^^^^^^^^^^^
N/A--just return!

Justification
^^^^^^^^^^^^^
There's no custom exit logic for the ownership predicate if it's a limbo exit, so no additional functionality needed.

canReturnLimboExit
------------------

.. code-block:: solidity

   function canReturnLimboExit(
       Checkpoint _limboSource,
       StateUpdate _limboTarget
       bytes _witness
   ) public returns (bool)

Returnability Witness Specification
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
The ``_witness`` is be unused for this predicate.

Additonal Requirements
^^^^^^^^^^^^^^^^^^^^^^
- **MUST** ensure that the tx.origin is the ``state.data.owner`` of the ``limboTarget``

Justification
^^^^^^^^^^^^^
We require the target owner's permission to return a limbo exit.

finalizeExit
------------

.. code-block:: solidity

   function finalizeExit(
       Checkpoint _exit
   ) public

Additional Requirements
^^^^^^^^^^^^^^^^^^^^^^^
- **MUST** fulfill the generic requirements for ``finalizeExit``.
- **MUST** make an internal call to ``onFinalizeExit`` to send the total amount to the ``_exit.stateUpdate.owner``.

Justification
^^^^^^^^^^^^^
The finalization logic for limbo and non-limbo exits remains the same.


onFinalizeTargetedExit
----------------------

.. code-block:: solidity

   function onFinalizeTargetedExit(
       Checkpoint _exit,
       StateUpdte _target
   ) public

Description
^^^^^^^^^^^
Logic for the target of a limbo exit to handle the exit's finalization.

Additional Requirements
^^^^^^^^^^^^^^^^^^^^^^^
- **MUST** make an internal call to ``onFinalizeExit`` to send the total amount to the ``_target.stateUpdate.owner``.

Justification
^^^^^^^^^^^^^
The finalization logic for limbo and non-limbo exits remains the same.

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
2. **MUST** ensure that the ``preState.plasmaBlockNumber`` is less thana the ``input.parameters.originBlock`` .
3. **MUST** return a ``StateUpdate`` with a range the same as ``transaction.start`` and ``transaction.end`` .
4. **MUST** return a ``StateUpdate`` with ``state`` is the same as the ``transaction.parameters.newState`` .
5. **MUST** ensure that the ``transaction.parameters.targetBlock`` is greater than or equal to the pending plasma block number .

Rationale
---------
These steps always produce a ``StateUpdate`` which passes the predicate contract's ``verifyStateTransition`` step.

***************
Guarding Plugin
***************

TODO
