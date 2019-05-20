################
Deposit Contract
################

***********
Description
***********

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
Represents a `state update`_, which contains the contextual information for how a particular `state object`_ was mutated.

Fields
^^^^^^
1. ``range`` - ``Range``: Range of state objects that were mutated.
2. ``stateObject`` - ``StateObject``: Resulting state object created by the mutation of the input objects.
3. ``plasmaContract`` - ``address``: Address of the plasma contract in which the update was included.
4. ``plasmaBlockNumber`` - ``uint256``: Plasma block number in which the update occurred.

Checkpoint
----------

.. code-block:: python

   struct Checkpoint:
       stateUpdate: StateUpdate
       checkpointedRange: Range

Description
^^^^^^^^^^^
Represents a `checkpoint`_ of a particular state update.

Fields
^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: State update being checkpointed.
2. ``checkpointedRange`` - ``Range``: Sub-range of the state update being checkpointed. We include this field because the update may be `partially spent`_.

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


CHALLENGE_PERIOD
----------------

.. code-block:: python

   CHALLENGE_PERIOD: public(uint256)

Description
^^^^^^^^^^^
Number of Ethereum blocks for which a checkpoint may be challenged.

EXIT_PERIOD
-----------

.. code-block:: python

   EXIT_PERIOD: public(uint256)

Description
^^^^^^^^^^^
Number of Ethereum blocks before an exit can be finalized.

totalDeposited
--------------

.. code-block:: python

   totalDeposited: public(uint256)

Description
^^^^^^^^^^^
Total amount deposited into this contract.

checkpoints
-----------

.. code-block:: python

   checkpoints: public(map(bytes32, CheckpointStatus))

Description
^^^^^^^^^^^
Mapping from the `ID of a checkpoint`_ to the checkpoint's status.

limboCheckpointOrigins
----------------------

.. code-block:: python

   limboCheckpointOrigins: public(map(bytes32, StateUpdate))

Description
^^^^^^^^^^^
Mapping from the `ID of a limbo checkpoint`_ to the `state update`_ from which the limbo checkpoint originated.

exitableRanges
--------------

.. code-block:: python

   exitableRanges: public(map(uint256, Range))

Description
^^^^^^^^^^^
Stores the list of ranges that have not been exited as a mapping from the ``start`` of a range to the full range. Prevents multiple exits from the same range of objects.

exitsRedeemableAfter
--------------------

.. code-block:: python

   exitsRedeemableAfter: public(map(bytes32, uint256))

Description
^^^^^^^^^^^
Mapping from the `ID of an exit`_ to the Ethereum block after which the exit can be finalized.

challengeStatuses
-----------------

.. code-block:: python

   challengeStatuses: public(map(bytes32, bool))

Description
^^^^^^^^^^^
Mapping from the `ID of a challenge`_ to whether or not the challenge is currently active.

Events
======

CheckpointStarted
-----------------

.. code-block:: python

   CheckpointStarted: event({
       checkpoint: bytes32,
       challengePeriodStart: uint256
   })

Description
^^^^^^^^^^^
Emitted whenever a user attempts to checkpoint a state update.

Fields
^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ that was started.
2. ``challengePeriodStart`` - ``uint256``: Ethereum block in which the checkpoint was started.

CheckpointChallenged
--------------------

.. code-block:: python

   CheckpointChallenged: event({
       checkpoint: bytes32,
       challenge: bytes32
   })

Description
^^^^^^^^^^^
Emitted whenever an `invalid history challenge`_ has been started on a checkpoint.

Fields
^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ that was challenged.
2. ``challenge`` - ``bytes32``: `ID of the challenge`_ on the checkpoint.

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

ExitFinalized
-------------

.. code-block:: python

   ExitFinalized: event({
       exit: bytes32
   })

Description
^^^^^^^^^^^
Emitted whenever an exit is finalized.

Fields
^^^^^^
1. ``exit`` - ``bytes32``: `ID of the exit`_ that was finalized.

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

startCheckpoint
---------------

.. code-block:: python

   @public
   def startCheckpoint(
       stateUpdate: StateUpdate,
       inclusionProof: bytes[1024],
       checkpointedRange: Range
   ):

Description
^^^^^^^^^^^
Starts a checkpoint for a given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: State update to checkpoint.
2. ``inclusionProof`` - ``bytes``: Proof that the state update was included in the block specified within the update.
3. ``checkpointedRange`` - ``Range``: Sub-range of the full state update to checkpoint. Necessary because a `state update may be partially spent`_.

Requirements
^^^^^^^^^^^^
- **MUST** verify the that ``stateUpdate`` was included in ``stateUpdate.block`` with ``inclusionProof``.
- **MUST** verify that ``checkpointedRange`` is actually a sub-range of ``stateUpdate.range``. 
- **MUST** add the new pending checkpoint to ``checkpoints``.
- **MUST** emit a ``CheckpointStarted`` event.

Rationale
^^^^^^^^^

Checkpoints are assertions that a certain state update occured/was included, and that it has no intersecting unspent ``StateUpdate`` s in its history.  Because the operator may publish an invalid block, it must undergo a challenge period in which the parties who care about the unspent ``StateUpdate`` in the history exit it, and use it to challenge the checkpoint.

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
- **MUST** execute ``transaction`` against ``stateUpdate`` by calling the state update's predicate.
- **MUST** verify that ``checkpointedRange`` is a sub-range of the state update created by executing ``transaction``.
- **MUST** create a new pending checkpoint in ``checkpoints`` for the state update created by the transaction.
- **MUST** insert the provided ``stateUpdate`` into ``limboCheckpointOrigins`` for the `ID of the checkpoint`_ that was created.
- **MUST** emit a ``CheckpointStarted`` event.

Rationale
^^^^^^^^^
Limbo checkpoints are safe to make as long as it is impossible that the operator included a conflicting (containing a different ``StateObject`` ) ``StateUpdate`` which can be output by the ``originatingStateUpdate`` predicate's ``executeTransaction`` method.  Further, if the operator may have included a ``StateUpdate`` which does have this output, a limbo checkpoint is necessary to guarantee safety.

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
.. todo::

- **MUST** ensure the checkpoint ranges intersect.
- **MUST** ensure that the plasma blocknumber of the ``olderCheckpoint`` is less than that of ``newerCheckpoint``.
- **MUST** ensure that the ``newerCheckpoint`` has no challenges.
- **MUST** ensure that the ``newerCheckpoint`` is no longer challengeable.
- **MUST** delete the entries in ``exits`` and ``checkpoints`` at the ``olderCheckpointId``.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for challengeCheckpointOutdated.

challengeCheckpointInvalidHistory
---------------------------------

.. code-block:: python

   def challengeCheckpointInvalid(
       challenge: Challenge
   ):

Description
^^^^^^^^^^^
Starts a challenge for a checkpoint by pointing to an exit that occurred in an earlier plasma block. Does **not** immediately cancel the checkpoint. Challenge can be blocked if the exit is cancelled.

Parameters
^^^^^^^^^^
1. ``challenge`` - ``Challenge``: Challenge to submit.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for challengeCheckpointInvalidHistory.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for challengeCheckpointInvalidHistory.

challengeLimboCheckpointAlternateSpend
--------------------------------------

.. code-block:: python

   def challengeLimboCheckpointAlternateTransaction(
      limboCheckpoint: bytes32,
      alternateTransaction: bytes[1024],
      inclusionProof: bytes[1024]
   ):

Description
^^^^^^^^^^^
Challenges a limbo checkpoint by demonstrating that there's an alternate spend of the originating state update. Immediately cancels the limbo checkpoint.

Parameters
^^^^^^^^^^
1. ``limboCheckpoint`` - ``bytes32``: `ID of the checkpoint`_ to challenge.
2. ``alternateTransaction`` - ``bytes``: Alternate transaction that spent from the same originating state update given by the limbo checkpoint.
3. ``inclusionProof`` - ``bytes``: Proof that the state update created by the given transaction was included in a plasma block.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for challengeLimboCheckpointAlternateSpend

Rationale
^^^^^^^^^
.. todo::

   Add rationale for challengeLimboCheckpointAlternateSpend

removeChallengeCheckpointInvalid
--------------------------------

.. code-block:: python

   def removeChallengeCheckpointInvalidHistory(
       challenge: bytes32
   ):

Description
^^^^^^^^^^^
Decrements the number of outstanding challenges on a checkpoint by showing that one of its challenges has been blocked.

Parameters
^^^^^^^^^^
1. ``challenge`` - ``bytes32``: `ID of the challenge`_ that was blocked.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for removeChallengeCheckpointInvalid.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for removeChallengeCheckpointInvalid.

startExit
---------

.. code-block:: python

   def startExit(checkpoint: bytes32, witness: bytes[1024]):

Description
^^^^^^^^^^^
Starts an exit from a checkpoint. Checkpoint may be pending or finalized.

Parameters
^^^^^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ from which to exit.
2. ``witness`` - ``bytes``: Extra witness data passed to the `predicate contract`_. Determines whether the sender of the transaction is allowed to start an exit from the checkpoint.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for startExit.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for startExit.

challengeExitDeprecated
-----------------------

.. code-block:: python

   def challengeExitDeprecated(
       checkpoint: bytes32,
       transaction: bytes[1024],
       inclusionProof: bytes[1024]
   ):

Description
^^^^^^^^^^^
Challenges an exit by showing that the checkpoint from which it spends has been `deprecated`_. Immediately cancels the exit.

Parameters
^^^^^^^^^^
1. ``checkpoint`` - ``bytes32``: `ID of the checkpoint`_ referenced by the exit.
2. ``transaction`` - ``bytes``: Transaction that spent the checkpointed state update.
3. ``inclusionProof`` - ``bytes``: Proof that the state updated created by the transaction was included in the plasma chain.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for challengeExitDeprecated.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for challengeExitDeprecated.

finalizeExit
------------

.. code-block:: python

   def finalizeExit(exit: bytes32):

Description
^^^^^^^^^^^
Finalizes an exit that has passed its exit period and has not been successfully challenged.

Parameters
^^^^^^^^^^
1. ``exit`` - ``bytes32``: `ID of the exit`_ to finalize.

Requirements
^^^^^^^^^^^^
.. todo::

   Add requirements for finalizeExit.

Rationale
^^^^^^^^^
.. todo::

   Add rationale for finalizeExit.

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

