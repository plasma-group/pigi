##################
Predicate Contract
##################

***********
Description
***********
Predicate contracts define the rules for particular state objects' exit game.  The most fundamental thing they define is the state transition logic, which accepts a transaction and an initial state update and outputs a new state update.  Because the predicate contract is a stateful main-chain contract, more advanced predicates can also define custom exit logic which must be evaluated before any state transitions are approved by the predicate.  Thus, predicates can be used as fully customized extensions to the base plasma cash exit game.

-------------------------------------------------------------------------------

***
API
***

Structs
=======

StateUpdate
-----------

.. code-block:: solidity

   struct StateUpdate {  
   }

Description
^^^^^^^^^^^

Fields
^^^^^^


-------------------------------------------------------------------------------

Transaction
-----------

.. code-block:: solidity

   struct Transaction {
   }

Description
^^^^^^^^^^^

Fields
^^^^^^


-------------------------------------------------------------------------------

Methods
=======

verifyDeprecation
----------------------

.. code-block:: solidity

   function verifyDeprecation(
       Checkpoint memory _checkpoint,
       bytes memory _deprecationWitness
   ) public returns (bool)

Description
^^^^^^^^^^^
Executes a transaction against a state update. Computes the new resulting state update and returns it.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: Original `StateUpdate`_ to execute a transaction against.
2. ``transaction`` - ``Transaction``: `Transaction`_ to execute against the state update.

Returns
^^^^^^^
``bool``: Whether the predicate can confirm deprecation of the given checkpoint

Rationale
^^^^^^^^^
Predicates are responsible for defining the logic that controls how a specific `state object`_ can be deprecated, making the next state object in the chain valid. Each predicate contract needs to implement this method so that other contracts can check whether a specific update on a state object was actually valid. We use this method most prominently when users are trying to `exit assets`_ from the plasma chain.

-------------------------------------------------------------------------------

onStartExitGame
----------------

.. code-block:: solidity

   function canStartExitGame(
       Checkpoint memory _checkpoint,
       bytes memory _parameters,
   ) public returns (boolean)

Description
^^^^^^^^^^^
Function called by the deposit contract when a user attempts to begin an exit on a given checkpoint.  The predicate can disallow the exit here by throwing a revert, or implement other custom logic if its exit subgame is stateful

Parameters
^^^^^^^^^^
1. ``_checkpoint`` - ``Checkpoint``: ``Checkpoint`` a user is attempting to exit.
2. ``_parameters`` - ``bytes``: Arbitrary data the user can provide as a witness to show that they're permitted to exit the state update, and setup any custom logic the predicate needs if it is a stateful predicate.

Returns
^^^^^^^
``boolean``: ``true`` if the user can start an exit, ``false`` otherwise.

Rationale
^^^^^^^^^
It's important that only certain users are actually permitted to exit a specific state object. For example, if you "own" an asset via the `SimpleOwnership`_ predicate, then it doesn't make sense for anyone but you to exit the asset. Furthermore, ownership is relatively clear under certain prediate models but less clear under others. We therefore need some arbitrary function that allows the predicate to determine who's allowed to exit funds locked with that predicate.


-------------------------------------------------------------------------------

onFinalizeExitGame
-------------------

.. code-block:: solidity

   function onFinalizeExitGame(
       Checkpoint memory _checkpoint
   ) public

Description
^^^^^^^^^^^
Hook called on the predicate contract whenever a corresponding exit is finalized. Will only be called if an exit is finalized on a state object locked with the given predicate.

Assets that correspond to the exited state object will be sent to the predicate along with this function call. The predicate can then decide what to do with these assets.

Parameters
^^^^^^^^^^
1. ``_checkpoint`` - ``Checkpoint``: The `Checkpoint`_ that was successfully exited.

Rationale
^^^^^^^^^
The idea of "exiting" a state object from the plasma chain slightly shifts in the generalized plasma model. We no longer think of "exiting" as withdrawing funds to a specific user. Instead, we think of it as moving a specific state object from the plasma chain back onto Ethereum.

For example, imagine a predicate that locks some funds on the plasma chain for a specified period of time. We don't want the user to be able to spend the funds before the locking period has ended. However, we **do** want to be able to do something in the case that the operator starts `withholding blocks`_. We effectively want to move the assets back onto Ethereum but *still keep them locked* until the timeout has finalized.

This hook makes that sort of functionality possible. Once the exit of a specific state update has been finalized, all the assets corresponding to that state update are transferred over to the predicate contract. The contract can then decide what to do with these funds later on.


