################
Deposit Contract
################

***********
Description
***********

Deposit contracts are the ethereum smart contracts into which assets are deposited--custodying the money as it is transacted on plasma and playing out the exit games to resolve the rightful owners of previously deposited assets.  As such, it contains the bulk of the logic for the plasma exit games.  The things it does not cover are 1) block commitments, and 2), state transitions, which are handled by calls to the commitment contract and predicate contracts specifically.

-------------------------------------------------------------------------------

***
API
***

Structs
=======

Range
-----

.. code-block:: python

   struct Range:
       start: uint256
       end: uint256

Description
^^^^^^^^^^^
Represents a range of `state objects`_.

Fields
^^^^^^
1. ``start`` - ``uint256``: Start of the range of objects.
2. ``end`` - ``uint256``: End of the range of objects.

-------------------------------------------------------------------------------


StateObject
-----------

.. code-block:: python

   struct StateObject:
       predicateAddress: address
       data: bytes[1024]

Description
^^^^^^^^^^^
Represents a `state object`_. Contains the address of the `predicate contract`_ and input data to that contract that control the conditions under which the object may be mutated.

Fields
^^^^^^
1. ``predicateAddress`` - ``address``: Address of the `predicate contract`_ that dictates how the object can be mutated.
2. ``data`` - ``bytes``: Arbitrary state data for the object.

-------------------------------------------------------------------------------


StateUpdate
-----------

.. code-block:: python

   struct StateUpdate:
       range: Range
       stateObject: StateObject
       plasmaContract: address
       plasmaBlockNumber: uint256

Description
^^^^^^^^^^^
Represents a `state update`_, which contains the contextual information for how a particular range of `state objects`_ was mutated.

Fields
^^^^^^
1. ``range`` - ``Range``: Range of state objects that were mutated.
2. ``stateObject`` - ``StateObject``: Resulting state object created by the mutation of the input objects.
3. ``plasmaContract`` - ``address``: Address of the plasma contract in which the update was included.
4. ``plasmaBlockNumber`` - ``uint256``: Plasma block number in which the update occurred.

-------------------------------------------------------------------------------


Checkpoint
----------

.. code-block:: python

   struct Checkpoint:
       stateUpdate: StateUpdate
       checkpointedRange: Range

Description
^^^^^^^^^^^
Represents a `checkpoint`_ of a particular state update on which a "checkpoint game" is being or has been played out.  Checkpoints wich have successfully passed the checkpoint game are considered "finalized", meaning the plasma contract should ignore all state updates on that range with an older plasma block number.

Fields
^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: State update being checkpointed.
2. ``checkpointedRange`` - ``Range``: Sub-range of the state update being checkpointed. We include this field because the update may be `partially spent`_.

-------------------------------------------------------------------------------


CheckpointStatus
----------------

.. code-block:: python

   struct CheckpointStatus:
       challengeableUntil: uint256
       outstandingChallenges: uint256

Description
^^^^^^^^^^^
Status of a particular checkpoint attempt.

Fields
^^^^^^
1. ``challengeableUntil`` - ``uint256``: Ethereum block number until which the checkpoint can still be challenged.
2. ``outstandingChallenges`` - ``uint256``: Number of outstanding challenges.

-------------------------------------------------------------------------------


Challenge
---------

.. code-block:: python

   struct Challenge:
       challengedCheckpoint: Checkpoint
       challengingCheckpoint: Checkpoint

Description
^^^^^^^^^^^
Describes a challenge against a checkpoint.

Fields
^^^^^^
1. ``challengedCheckpoint`` - ``Checkpoint``: Checkpoint being challenged.
2. ``challengingCheckpoint`` - ``Checkpoint``: Checkpoint being used to challenge.

-------------------------------------------------------------------------------


Public Variables
================

COMMITMENT_ADDRESS
------------------

.. code-block:: python

   COMMITMENT_ADDRESS: public(address)

Description
^^^^^^^^^^^
Address of the `commitment contract`_ where block headers for the plasma chain are being published.

Requirements
^^^^^^^^^^^^
Deposit contracts **MUST** specify the address of a `commitment contract`_ where plasma chain block headers are being published.

Rationale
^^^^^^^^^
Deposit contracts handle deposits and exits from a specific plasma chain. Commitment contracts hold the plasma block headers for that plasma chain and therefore make it possible to verify `inclusion proofs`_.

-------------------------------------------------------------------------------


TOKEN_ADDRESS
-------------

.. code-block:: python

   TOKEN_ADDRESS: public(address)

Description
^^^^^^^^^^^
Address of the `ERC-20 token`_ which this deposit contract custodies.

Requirements
^^^^^^^^^^^^
- The deposit contract:
   - **MUST** only support deposits of a single `ERC-20 token`_.
- ``TOKEN_ADDRESS``:
   - **MUST** be the address of an ERC-20 token.

Rationale
---------
Each asset type needs to be allocated its own large contiguous "sub-range" within the larger Plasma Cashflow chain. Without these sub-ranges, `defragmentation`_ becomes effectively impossible. Although it's possible to achieve this result within a single deposit contract, it's easier to simply require that each asset have its own deposit contract and to allocate a large sub-range to every deposit contract.

-------------------------------------------------------------------------------


CHALLENGE_PERIOD
----------------

.. code-block:: python

   CHALLENGE_PERIOD: public(uint256)

Description
^^^^^^^^^^^
Number of Ethereum blocks for which a checkpoint may be challenged.

-------------------------------------------------------------------------------


EXIT_PERIOD
-----------

.. code-block:: python

   EXIT_PERIOD: public(uint256)

Description
^^^^^^^^^^^
Number of Ethereum blocks before an exit can be finalized.

-------------------------------------------------------------------------------


totalDeposited
--------------

.. code-block:: python

   totalDeposited: public(uint256)

Description
^^^^^^^^^^^
Total amount deposited into this contract.

-------------------------------------------------------------------------------


checkpoints
-----------

.. code-block:: python

   checkpoints: public(map(bytes32, CheckpointStatus))

Description
^^^^^^^^^^^
Mapping from the `ID of a checkpoint`_ to the checkpoint's status.

-------------------------------------------------------------------------------


limboCheckpointOrigins
----------------------

.. code-block:: python

   limboCheckpointOrigins: public(map(bytes32, bytes32))

Description
^^^^^^^^^^^
Mapping from the `ID of a limbo checkpoint`_ to the hash of the `state update`_ from which the limbo checkpoint originated.

-------------------------------------------------------------------------------


exitableRanges
--------------

.. code-block:: python

   exitableRanges: public(map(uint256, Range))

Description
^^^^^^^^^^^
Stores the list of ranges that have not been exited as a mapping from the ``start`` of a range to the full range. Prevents multiple exits from the same range of objects.

-------------------------------------------------------------------------------


exits
-----

.. code-block:: python

   exits: public(map(bytes32, uint256))

Description
^^^^^^^^^^^
Mapping from the `ID of an exit`_ to the Ethereum block after which the exit can be finalized.

-------------------------------------------------------------------------------


challengeStatuses
-----------------

.. code-block:: python

   challengeStatuses: public(map(bytes32, bool))

Description
^^^^^^^^^^^
Mapping from the `ID of a challenge`_ to whether or not the challenge is currently active.

-------------------------------------------------------------------------------


Events
======

CheckpointStarted
-----------------

.. code-block:: python

   CheckpointStarted: event({
       checkpoint: Checkpoint,
       challengeableUntil: uint256
   })

Description
^^^^^^^^^^^
Emitted whenever a user attempts to checkpoint a state update.

Fields
^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ that was started.
2. ``challengeableUntil`` - ``uint256``: Ethereum block in which the checkpoint was started.

-------------------------------------------------------------------------------


CheckpointChallenged
--------------------

.. code-block:: python

   CheckpointChallenged: event({
       challenge: Challenge
   })

Description
^^^^^^^^^^^
Emitted whenever an `invalid history challenge`_ has been started on a checkpoint.

Fields
^^^^^^
1. ``challenge`` - ``Challenge``: The details of the `challenge`_ .

-------------------------------------------------------------------------------


CheckpointFinalized
-------------------

.. code-block:: python

   CheckpointFinalized: event({
       checkpoint: bytes32
   })

Description
^^^^^^^^^^^
Emitted whenever a checkpoint is finalized.

Fields
^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ that was finalized.

-------------------------------------------------------------------------------


ExitStarted
-----------

.. code-block:: python

   ExitStarted: event({
       exit: bytes32,
       exitPeriodStart: uint256
   })

Description
^^^^^^^^^^^
Emitted whenever an exit is started.

Fields
^^^^^^
1. ``exit`` - ``bytes32``: `ID of the exit`_ that was started.
2. ``exitPeriodStart`` - ``uint256``: Ethereum block in which the exit was started.

-------------------------------------------------------------------------------


ExitFinalized
-------------

.. code-block:: python

   ExitFinalized: event({
       exit: Checkpoint
   })

Description
^^^^^^^^^^^
Emitted whenever an exit is finalized.

Fields
^^^^^^
1. ``exit`` - ``Checkpoint``: `The checkpoint`_ that had its exit finalized.

-------------------------------------------------------------------------------


Methods
=======

deposit
-------

.. code-block:: python

   @public
   def deposit(depositer: address, amount: uint256, initialState: StateObject):

Description
^^^^^^^^^^^
Allows a user to submit a deposit to the contract. Only allows users to submit deposits for the `asset represented by this contract`_.

Parameters
^^^^^^^^^^
1. ``depositer`` - ``address``: the account which has approved the ERC20 deposit.
2. ``amount`` - ``uint256``: Amount of the asset to deposit. 
3. ``initialState`` - ``StateObject``: Initial state to put the deposited assets into. Can be any valid `state object`_.

Requirements
^^^^^^^^^^^^
- **MUST** keep track of the total deposited assets, ``totalDeposited``.
- **MUST** transfer the deposited ``amount`` from the ``depositer`` to the deposit contract's address.
- **MUST** create a `state update`_ with a `state object`_ equal to the provided ``initialState``.
- **MUST** compute the range of the created state update as ``totalDeposited`` to ``totalDeposited + amount``.
- **MUST** update the total amount deposited after the deposit is handled.
- **MUST** insert the created state update into the ``checkpoints`` mapping with ``challengeableUntil`` being the current block number - 1.
- **MUST** emit a ``CheckpointFinalized`` event for the inserted checkpoint.

Rationale
^^^^^^^^^
Depositing is the mechanism which locks an asset into the plasma escrow agreement, allowing it to be transacted off-chain.  The ``initialState`` defines its spending conditions, in the same way that a ``StateUpdate`` does once further transactions are made.  Because deposits are verified on-chain transactions, they can be treated as checkpoints which are unchallengeable.

-------------------------------------------------------------------------------


startCheckpoint
---------------

.. code-block:: python

   @public
   def startCheckpoint(
       checkpoint: Checkpoint,
       inclusionProof: bytes[1024],
       exitableRangeId: uint256
   ):

Description
^^^^^^^^^^^
Starts a checkpoint for a given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: State update to checkpoint.
2. ``inclusionProof`` - ``bytes``: Proof that the state update was included in the block specified within the update.
3. ``exitableRangeId`` - ``uint256``: The key in the ``exitableRanges`` mapping which includes the ``checkpointedRange`` as a subrange.

Requirements
^^^^^^^^^^^^
- **MUST** verify the that ``checkpoint.stateUpdate`` was included with ``inclusionProof``.
- **MUST** verify that ``checkpointedRange`` is actually a sub-range of ``stateUpdate.range``.
- **MUST** verify that the ``checkpointedRange`` is still exitable with the ``exitableRangeId`` .
- **MUST** verify that an indentical checkpoint has not already been started.
- **MUST** add the new pending checkpoint to ``checkpoints`` with ``chllengeableUntil`` equalling the current ethereum ``block.number + CHALLENGE_PERIOD`` .
- **MUST** emit a ``CheckpointStarted`` event.

Rationale
^^^^^^^^^
Checkpoints are assertions that a certain state update occured/was included, and that it has no intersecting unspent state updates in its history.  Because the operator may publish an invalid block, it must undergo a challenge period in which the parties who care about the unspent state update in the history exit it, and use it to challenge the checkpoint.

-------------------------------------------------------------------------------


startLimboCheckpoint
--------------------

.. code-block:: python

   def startLimboCheckpoint(
       originatingStateUpdate: StateUpdate,
       inclusionProof: bytes[1024],
       transaction: bytes[1024],
       checkpointedRange: Range
   ):

Description
^^^^^^^^^^^
Allows a user to start a `limbo checkpoint`_ from a given state update. Necessary in the case that the operator `withholds data`_ after a transaction has been sent.

Parameters
^^^^^^^^^^
1. ``originatingStateUpdate`` - ``StateUpdate``: State update from which the limbo checkpoint originates.
2. ``inclusionProof`` - ``bytes``: Proof that the originating state update was included in the block specified in the update.
3. ``transaction`` - ``bytes``: Transaction that spends the update and creates a new one.
4. ``checkpointedRange`` - ``Range``: Sub-range of the new state update created by the transaction to checkpoint. Necessary because a `state update may be partially spent`_.

Requirements
^^^^^^^^^^^^
- **MUST** verify that ``originatingStateUpdate`` was included in ``originatingStateUpdate.block`` via ``inclusionProof``.
- **MUST** execute ``transaction`` against ``stateUpdate`` by calling the state update's predicate to calculate a ``limboStateUpdate``.
- **MUST** verify that the ``limboStateUpdate.plasmaBlocknumber`` exceeds that of the ``originatingStateUpdate``
- **MUST** verify that ``checkpointedRange`` is a sub-range of ``limboStateUpdate``.
- **MUST** verify that ``checkpointedRange`` is a sub-range of ``originatingStateUpdate``.
- **MUST** create a new pending checkpoint in ``checkpoints`` with the ``limboStateUpdate`` and given ``checkpointedRange``.
- **MUST** insert the hash of the provided ``stateUpdate`` into ``limboCheckpointOrigins`` for the `ID of the checkpoint`_ that was created.
- **MUST** emit a ``CheckpointStarted`` event.

Rationale
^^^^^^^^^
Limbo checkpoints are safe to make as long as it is impossible that the operator included a conflicting (containing a different ``StateObject`` ) ``StateUpdate`` which can be output by the ``originatingStateUpdate`` predicate's ``executeTransaction`` method.  Further, if the operator may have included a ``StateUpdate`` which does have this output, a limbo checkpoint is necessary to guarantee safety.

-------------------------------------------------------------------------------


challengeCheckpointOutdated
---------------------------

.. code-block:: python

   def challengeCheckpointOutdated(
       olderCheckpoint: Checkpoint,
       newerCheckpoint: Checkpoint
   ):

Description
^^^^^^^^^^^
Challenges a checkpoint by showing that there exists a newer finalized checkpoint. Immediately cancels the checkpoint.

Parameters
^^^^^^^^^^
1. ``olderCheckpoint`` - ``Checkpoint``: `The checkpoint`_ to challenge.
2. ``newerCheckpoint`` - ``Checkpoint``: `The checkpoint`_ used to challenge.

Requirements
^^^^^^^^^^^^
- **MUST** ensure the checkpoint ranges intersect.
- **MUST** ensure that the plasma blocknumber of the ``olderCheckpoint`` is less than that of ``newerCheckpoint``.
- **MUST** ensure that the ``newerCheckpoint`` has no challenges.
- **MUST** ensure that the ``newerCheckpoint`` is no longer challengeable.
- **MUST** delete the entries in ``exits`` and ``checkpoints`` at the ``[olderCheckpointId]``.

Rationale
^^^^^^^^^
If a checkpoint game has finalized, the safety property should be that nothing is valid in that range's previous blocks--"the history has been erased."  However, since there still might be some ``StateUpdates`` included in the blocks prior, invalid checkpoints can be initiated.  This method allows the rightful owner to demonstrate that the initiated ``olderCheckpoint`` is invalid and must be deleted.

-------------------------------------------------------------------------------


challengeCheckpointInvalidHistory
---------------------------------

.. code-block:: python

   def challengeCheckpointInvalid(
       challenge: Challenge
       limboOrigin: StateUpdate
   ):

Description
^^^^^^^^^^^
Starts a challenge for a checkpoint by pointing to an exit that occurred in an earlier plasma block. Does **not** immediately cancel the checkpoint. Challenge can be blocked if the exit is cancelled.

Parameters
^^^^^^^^^^
1. ``challenge`` - ``Challenge``: Challenge to submit.
2. ``limboOrigin`` - ``StateUpdate``: The originating state update if the ``olderCheckpoint`` is a limbo checkpoint (unneeded if it isn't)

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the checkpoint being used to challenge exists.
- **MUST** ensure that the challenge ranges intersect.
- **MUST** ensure that the checkpoint being used to challenge has an older ``plasmaBlockNumber``.
- **MUST** ensure that an identical challenge is not already underway.
- **MUST** ensure that the current ethereum block is not greater than the ``challengeableUntil`` block for the checkpoint being challenged.
- **MUST** check whether the checkpoint being challenged is a limbo checkpoint.  If it is:
   - **MUST** check that the provided ``limboOrigin`` was the correct originating state update for the limbo exit.
   - **MUST** ensure that the challenging checkpoint has an earlier ``plasmaBlocknumber`` than that of the ``limboOrigin``.
- **MUST** increment the ``outstandingChallenges`` for the challenged checkpoint.
- **MUST** set the ``challenges`` mapping for the ``challengeId`` to true.

Rationale
^^^^^^^^^
If the operator includes an invalid ``StateUpdate`` (i.e. there is no transaction from the last valid ``StateUpdate`` on an intersecting range), they may checkpoint it and attempt a malicious exit.  To prevent this, the valid owner must checkpoint their unspent state, exit it, and create a challenge on the invalid checkpoint.

-------------------------------------------------------------------------------


challengeLimboCheckpointAlternateSpend
--------------------------------------

.. code-block:: python

   def challengeLimboCheckpointAlternateTransaction(
      limboCheckpoint: Checkpoint,
      originatingStateUpdate: StateUpdate,
      alternateTransaction: bytes[1024],
   ):

Description
^^^^^^^^^^^
Challenges a limbo checkpoint by demonstrating that there's an alternate spend of the originating state update. Immediately cancels the limbo checkpoint.

Parameters
^^^^^^^^^^
1. ``limboCheckpoint`` - ``Checkpoint``: `The checkpoint`_ to challenge.
2. ``origintingStateUpdate`` - ``StateUpdate``: the original state update whose inclusion was proven at the time the limbo checkpoint was originated.
3. ``alternateTransaction`` - ``bytes``: Alternate transaction that spent from the same originating state update given by the limbo checkpoint.

Requirements
^^^^^^^^^^^^
- **MUST** ensure the limbo checkpoint exists and was created with the ``originatingStateUpdate`` .
- **MUST** calculate the ``alternateStateUpdate`` from the limbo checkpoint's ``originatingStateUpdate`` and the ``alternateTransaction`` .
- **MUST** ensure the ``alternateStateUpdate.range`` intersects the ``limboCheckpoint.checkpointedRange`` .
- **MUST** ensure the ``alternateStateUpdate.state`` conflict's the ``limboCheckpoint.StateUpdate.state`` .
- **MUST** delete the entries in ``limboCheckpoints`` , ``checkpoints`` , and ``exits`` at the ``limboCheckpointId`` if the above conditions are met.

Rationale
^^^^^^^^^
Limbo checkpoints are invalid if an alternate spend was included from the originating state update.  For example, if Alice spent to Bob, but limbo exits her original ownership state with a limbo transaction to herself, Bob may cancel it by demonstrating the conflicting transaction which spends to her.  This prevents the attacks which limbo exits would otherwise introduce.

-------------------------------------------------------------------------------


removeChallengeCheckpointInvalid
--------------------------------

.. code-block:: python

   def removeChallengeCheckpointInvalidHistory(
       challenge: Challenge
   ):

Description
^^^^^^^^^^^
Decrements the number of outstanding challenges on a checkpoint by showing that one of its challenges has been blocked.

Parameters
^^^^^^^^^^
1. ``challenge`` - ``Challenge``: `The challenge`_ that was blocked.

Requirements
^^^^^^^^^^^^
- **MUST** check that the challenge was not already removed.
- **MUST** check that the challenging exit has since been removed.
- **MUST** remove the challenge if above conditions are met.
- **MUST** decrement the challenged checkpoint's ``outstandingChallenges`` if the above conditions are met.

Rationale
^^^^^^^^^
Anyone can exit a prior state which was since spent and use it to challenge despite it being deprecated.  To remove this invalid challenge, the challenged checkpointer may demonstrate the exit is deprecated, deleting it, and then call this method to remove the challenge.

-------------------------------------------------------------------------------


startExit
---------

.. code-block:: python

   def startExit(checkpoint: Checkpoint, witness: bytes[1024]):

Description
^^^^^^^^^^^
Starts an exit from a checkpoint. Checkpoint may be pending or finalized.

Parameters
^^^^^^^^^^
1. ``checkpoint`` - ``Checkpoint``: `The checkpoint`_ from which to exit.
2. ``witness`` - ``bytes``: Extra witness data passed to the `predicate contract`_. Determines whether the sender of the transaction is allowed to start an exit from the checkpoint.

Requirements
^^^^^^^^^^^^
- **MUST** ensure the checkpoint exists.
- **MUST** ensure an exit on the checkpoint is not already underway.
- **MUST** ensure the party exiting is allowed to via ``Checkpoint.StateUpdate.state.predicateAddress.canExitCheckpoint(checkpoint, witness)``
- **MUST** set the exit's ``redeemableAfter`` status to the current Ethereum ``block.number + LOCKUP_PERIOD``.
- **MUST** emit an ``exitStarted`` event.

Rationale
^^^^^^^^^
For a user to redeem state from the plasma chain onto the main chain, they must checkpoint it and respond to all challenges on the checkpoint, and await a ``LOCKUP_PERIOD`` to demonstrate that the checkpointed subrange has not been deprecated by any transactions.  This is the method which starts the latter process on a given checkpoint.

-------------------------------------------------------------------------------


challengeExitDeprecated
-----------------------

.. code-block:: python

   def challengeExitDeprecated(
       checkpoint: Checkpoint,
       transaction: bytes[1024]
   ):

Description
^^^^^^^^^^^
Challenges an exit by showing that the checkpoint from which it spends has been `deprecated`_. Immediately cancels the exit.

Parameters
^^^^^^^^^^
1. ``checkpoint`` - ``Checkpoint``: `The checkpoint`_ referenced by the exit.
2. ``transaction`` - ``bytes``: Transaction that spent the checkpointed state update.

Requirements
^^^^^^^^^^^^
- **MUST** ensure the ``transaction`` results in a valid ``StateUpdate`` by calling the ``executeTransaction(checkpoint.StateUpdate, transaction)`` for the ``checkpoint.stateUpdate.predicateAddress`` .
- **MUST** ensure the ``StateUpdate`` resulting from the transaction intersects the ``checkpoint.subRange``.
- **MUST** delete the ``exit`` from ``exits`` at the ``checkpointId`` .

Rationale
^^^^^^^^^
If a transaction exists spending from a checkpoint, the checkpoint may still be valid, but an exit on it is not.  This challenge deletes the exit by demonstrating such a transaction.

-------------------------------------------------------------------------------


finalizeExit
------------

.. code-block:: python

   def finalizeExit(exit: Checkpoint, exitableRangeId: uint256):

Description
^^^^^^^^^^^
Finalizes an exit that has passed its exit period and has not been successfully challenged.

Parameters
^^^^^^^^^^
1. ``exit`` - ``Checkpoint``: `The checkpoint`_ on which the exit is not finalizable.
2. ``exitableRangeId`` - ``uint256``: the entry in ``exitableRanges`` demonstrating the range is not yet exited.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the checkpoint is finalized (current Ethereum block exceeds ``checkpoint.challengeableUntil``).
- **MUST** ensure that the checkpoint's ``outstandingChallenges`` is 0.
- **MUST** ensure that the exit is finalized (current Ethereum block exceeds ``redeemablAfter`` ).
- **MUST** ensure that the checkpoint is on a subrange of the currently exitable ranges via ``exitableRangeId``.
- **MUST** approve an ERC20 transfer of the ``end - start`` amount to the predicate address.
- **MUST** call the predicate's ``onExitFinalized`` method to finalize the exit.
- **MUST** delete the exit.
- **MUST** remove the exited range by updating the ``exitableRanges`` mapping.
- **MUST** delete the checkpoint.
- **MUST** emit an ``exitFinalized`` event.

Rationale
^^^^^^^^^
Exit finalization is the step which actually allows the assets locked in plasma to be used on the main chain again.  Finalization requires that the exit and checkpoint games have completed successfully.


.. _`state objects`: TODO
.. _`state object`: TODO
.. _`predicate contract`: TODO
.. _`state update`: TODO
.. _`checkpoint`: TODO
.. _`limbo checkpoint`: TODO
.. _`withholds data`: TODO
.. _`deprecated`: TODO
.. _`partially spent`:
.. _`state update may be partially spent`: TODO
.. _`commitment contract`: TODO
.. _`inclusion proofs`: TODO
.. _`ERC-20 token`: TODO
.. _`defragmentation`: TODO
.. _`ID of a checkpoint`:
.. _`ID of the checkpoint`:
.. _`ID of a limbo checkpoint`: TODO
.. _`ID of an exit`:
.. _`ID of the exit`: TODO
.. _`ID of a challenge`:
.. _`ID of the challenge`: TODO
.. _`invalid history challenge`: TODO
.. _`asset represented by this contract`: TODO

