##################
Predicate Contract
##################

***********
Description
***********

Predicate contracts define the rules for particular state objects' exit game.  The most fundamental thing they define is the state transition logic, which accepts a transaction and an initial state update and outputs a new state update.  Because the predicate contract is a stateful main-chain contract, more advanced predicates can also define custom exit logic which must be evaluated before any state transitions are approved by the predicate.  Thus, predicates can be used as fully customized extensions to the base plasma cash exit game.

***
API
***

Methods
=======

executeStateTransition
----------------------

.. code-block:: python

   @public
   def executeStateTransition(
       stateUpdate: StateUpdate,
       transaction: Transaction
   ) -> StateUpdate:

Description
^^^^^^^^^^^
Executes a transaction against a state update. Computes the new resulting state update and returns it.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: Original `StateUpdate`_ to execute a transaction against.
2. ``transaction`` - ``Transaction``: `Transaction`_ to execute against the state update.

Returns
^^^^^^^
``StateUpdate``: The `StateUpdate`_ created as a result of executing the transaction.

Rationale
^^^^^^^^^
Predicates are responsible for defining the logic that controls how a specific `state object`_ can be manipulated. Each predicate contract needs to implement this method so that other contracts can check whether a specific spend of a state object was actually valid. We use this method most prominently when users are trying to `exit assets`_ from the plasma chain.

-------------------------------------------------------------------------------


getAdditionalExitPeriod
-----------------------

.. code-block:: python

   @public
   def getAdditionalExitPeriod() -> uint256:

Description
^^^^^^^^^^^
Defines an additional number of blocks that exits of state objects locked by this predicate must wait. Will likely just return zero in most cases, but predicates can return more than zero if additioanl time is necessary to establish the validity of a spend.

Returns
^^^^^^^
``uint256``: Number of Ethereum blocks to add to the exit period of a state object locked with this predicate.

Rationale
^^^^^^^^^
We need this method for relatively subtle reasons. It's possible for the spending conditions for a predicate to be very easy to check off-chain but very hard to check on-chain. For example, the validity of a transaction might depend on the existence of a large amount of data. In such cases, it may take longer than the `standard exit period`_ to prove that a given transaction (that would be used to cancel the exit) was valid.

We basically had two choices here. We could, of course, force predicates not to rely on any logic that would take longer than the standard exit period to verify. We could also allow predicates to specify some additional period of time before an exit could be processed. The additional time would allow predicates to carry out more complex logic. Both options are pretty good, but we decided on the second mainly for the purpose of future-proofing.

-------------------------------------------------------------------------------


canStartExitGame
----------------

.. code-block:: python

   @public
   def canStartExitGame(
       stateUpdate: StateUpdate,
       witness: bytes[1024]
   ) -> boolean:

Description
^^^^^^^^^^^
Determines whether a user is permitted to start an exit for a given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: ``StateUpdate`` the user is attempting to exit.
2. ``witness`` - ``bytes``: Arbitrary witness data the user can provide to show that they're permitted to exit the state update.

Returns
^^^^^^^
``boolean``: ``true`` if the user can start an exit, ``false`` otherwise.

Rationale
^^^^^^^^^
It's important that only certain users are actually permitted to exit a specific state object. For example, if you "own" an asset via the `SimpleOwnership`_ predicate, then it doesn't make sense for anyone but you to exit the asset. Furthermore, ownership is relatively clear under certain prediate models but less clear under others. We therefore need some arbitrary function that allows the predicate to determine who's allowed to exit funds locked with that predicate.

-------------------------------------------------------------------------------


onExitGameFinalized
-------------------

.. code-block:: python

   @public
   @payable
   def onExitGameFinalized(
       stateUpdate: StateUpdate
   ):

Description
^^^^^^^^^^^
Hook called on the predicate contract whenever a corresponding exit is finalized. Will only be called if an exit is finalized on a state object locked with the given predicate.

Assets that correspond to the exited state object will be sent to the predicate along with this function call. The predicate can then decide what to do with these assets.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: The `StateUpdate`_ that was successfully exited.

Rationale
^^^^^^^^^
The idea of "exiting" a state object from the plasma chain slightly shifts in the generalized plasma model. We no longer think of "exiting" as withdrawing funds to a specific user. Instead, we think of it as moving a specific state object from the plasma chain back onto Ethereum.

For example, imagine a predicate that locks some funds on the plasma chain for a specified period of time. We don't want the user to be able to spend the funds before the locking period has ended. However, we **do** want to be able to do something in the case that the operator starts `withholding blocks`_. We effectively want to move the assets back onto Ethereum but *still keep them locked* until the timeout has finalized.

This hook makes that sort of functionality possible. Once the exit of a specific state update has been finalized, all the assets corresponding to that state update are transferred over to the predicate contract. The contract can then decide what to do with these funds later on.


