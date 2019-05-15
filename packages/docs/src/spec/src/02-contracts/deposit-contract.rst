################
Deposit Contract
################
All implementations must provide a standard deposit contract that allows a user to deposit assets "into" the plasma chain by locking the assets on Ethereum, and unlocking via the evaluation of an exit game.  This document covers the functionality of that

General Structs
================

Ranges
-------

.. code-block:: python

   struct Range:
       start: uint256
       end: bool

Description
^^^^^^^^^^^
Data structure representing a ranges of assets in Plasma Cashflow.

Fields
^^^^^^
1. ``start`` - ``uint256``: the start of the range of state objects.
2. ``end`` - ``uint256``: the end of the range of state objects.

State Objects
---------------
.. code-block:: python

   struct StateObject:
       predicateAddress: address
       data: bytes[1024]

Description
^^^^^^^^^^^^^
A state object contains the information associated with the spending conditions of a particular stateId.  This includes the predicate (e.g. ``ownershipPredicate``) and associated data (e.g. ``.owner = alice``).

Fields
^^^^^^^^
1. ``predicateAddress`` - ``address``: the on-chain address of the predicate contract which controls the state object's transition conditions.
2. ``data`` - ``bytes``: arbitrary bytes corresponding to the particular instantiation of that object, such as an owner for ownership, an exchange rate for an open trade, a multisig threshold, etc.

State Updates
---------------
.. code-block:: python

   struct StateUpdate:
       state: StateObject
       range: Range
       plasmaBlockNumber: uint256
       plasmaContract: address

Description
^^^^^^^^^^^^^
State updates consist of all the information associated with a particular inclusion proof, and are the things which are exited from.  This includes the state, start, and end of the range of state objects, the plasma block number they were committed to, and the plasma contract they were committed on behalf of.

Fields
^^^^^^^^^^^
1. ``state`` - ``stateObject``: the transition conditions for this range of coins.
2. ``range`` - ``range``: the range of coins this update was on.
3. ``plasmaBlockNumber`` - ``uint256``: the plasma block number in which this update occurred.
4. ``plasmaContract`` - ``address``: the plasma contract which this update was meant for.

General Public Variables
=========================
.. code-block:: python
  COMMITMENT_ADDRESS: public(address)
  TOKEN_ADDRESS: public(address)
  CHALLENGE_PERIOD: public(uint256)
  EXIT_PERIOD: public(uint256)

Descriptions
^^^^^^^^^^^^^^^
1. ``COMMITMENT_ADDRESS`` - ``address``: The address of the on-chain commitment contract where blocks for this plasma contract are published.
2. ``TOKEN_ADDRESS`` - ``address``: The address of the ERC20 tokens which this plasma contract custodies.
3. ``CHALLENGE_PERIOD`` - ``uint256``: The number of Ethereum blocks for which a checkpoint may be challenged after the checkpoint has begun.
4. ``EXIT_PERIOD`` - ``uint256``: The number of Ethereum blocks before an exit can be finalized.

Depositing
=============
To begin using plasma, users need to deposit some funds into this deposit contract.

Public Variables
-----------------
.. code-block:: python

   totalDeposited: public(uint256)

The plasma contract stores the total amount which has been deposited into the chain thus far.

Depositing
--------------
Interface
^^^^^^^^^^
.. code-block:: python

   def makeDeposit(amount: amount):

Description
^^^^^^^^^^^^^
Depositing into a plasma contract creates a new range of exitable coins and records this fact with a new ``Checkpoint`` object (see below).

Pseudocode
^^^^^^^^^^^^
.. code-block:: python

  def makeDeposit(from: address, amount: amount, initialState: StateObject):
       ERC20(self.TOKEN_ADDRESS).transferFrom(from, self.address, amount)
       depositStart: uint256 = self.totalDeposited
       self.totalDeposited += amount
       depopsitEndL uint256 = self.totalDeposited

       depositStateUpdate: StateUpdate

       depositStateUpdate.range = {start: depositStart, end: depositEnd}
       depositStateUpdate.plasmaBlockNumber = CommitmentContract(self.COMMITMENT_ADDRESS).lastPlasmaBlockNumber
       depositStateUpdate.state = initialState
       depositStateUpdate.plasmaContract = self.address

       checkpointID: bytes32 = self.getCheckpointID(depositStateUpdate)
       self.checkpoints[checkpointID].challengeableUntil = block.number - 1 # this checkpoint cannot be challenged, deposits are always valid



Checkpointing
==============

Description
-------------

Ckeckpoints represent a historic on-chain state which the plasma contract has determined is "canonical"--either because a checkpoint game was played on it, or because it was a deposit--so that all history before it may be ignored.  Checkpoints undergo a challenge period after which they are finalized.  If a user has only verified a subrange of the total State Update, they specify this subrange during the checkpointing process.  Exits point at checkpoints, and both an exit its checkpoint must be finzalized before a checkpoint is successful.

Structs
-------

.. code-block:: python

   struct Checkpoint:
       stateUpdate: StateUpdate
       subrange: Range
   struct CheckpointStatus:
       challengeableUntil: uint256
       numChallenges: uint256

Descriptions
^^^^^^^^^^^^^
- ``Checkpoint``: the ``StateUpdate`` being checkpointed and the ``subrange`` which the checkointer has validated history for

- ``CheckpointStatus``: the status of a current checkpoint.

- ``LimboCheckpoint``: the details of limbo checkpoint. The ``originatingStateUpdateHash`` is computed via ``hash(rlp.encode(originatingStateUpdate))``

Public Variables
-----------------

.. code-block:: python

  checkpoints: public(map(bytes32, CheckpointStatus))
  limboCheckpointOrigins: public(map(bytes32, StateUpdate))   

Description
^^^^^^^^^^^
Checkpoints and limbo checkpoints are stored in a mapping with keys as their unique ``checkpointID: bytes32``.  The ``checkpointID`` is calculated as ``hash(stateUpdate, subrange))``.

If the checkpoint is limbo checkpoint, then its ``originatingStateUpdate: StateUpdte`` is recorded at the ``checkppointID`` in ``self.limboCheckpoints``

Standard Checkpoint Method
--------------------------
Interface
^^^^^^^^^^
.. code-block:: python

  def beginCheckpoint(stateUpdate: StateUpdate, inclusionProof: bytes[1024], subrange: Range):

Description
^^^^^^^^^^^^
This is the standard way that checkpoints are made, by demonstrating inclusion in a plasma block.

Pseudocode
^^^^^^^^^^^^
.. code-block:: python

def beginCheckpoint(stateUpdate: StateUpdate, inclusionProof: bytes[1024]):
       assert CommitmentContract(self.COMMITMENT_ADDRESS).verifyInclusion(stateUpdate, inclusionProof)
       assert isSubrange(subrange, stateUpdate.range)
       self.checkpoints[checkpoiontID].challengeableUntil = block.number + self.CHALLENGE_PERIOD

Limbo Checkpoint Method
------------------------
Interface
^^^^^^^^^^

.. code-block:: python

  def beginLimboCheckpoint(oldStateUpdate: StateUpdate, inclusionProof: bytes[1024], transaction: bytes[1024], subrange: Range):

Description
^^^^^^^^^^^^^
If a user sends the operator a transaction, but its inclusion is withheld, an inclusion proof may not be given.  However, if the withheld block does end up including the update, it could be used to cancel an exit.  So, the ``limboCheckpoint`` method may be called with an inclusion proof of the originating update, and a transaction generating the "limbo" state update.

Limbo checkpointing is effectively a claim that "I'm not sure if this state update was included, but it is the only possible state update which COULD have been included, so let's checkpoint as if it was."  We implement a separate way to cancel a limbo checkpoint if that claim is invalid below.

Pseudocode
^^^^^^^^^^^
.. code-block:: python

  def beginLimboCheckpoint(oldStateUpdate: StateUpdate, inclusionProof: bytes[1024], transaction: bytes[1024], subrange: Range):
       assert CommitmentContract(self.COMMITMENT_ADDRESS).verifyInclusion(oldStateUpdate, inclusionProof)
       newStateUpdate: StateUpdate = Predicate(oldStateUpdate.state.predicateAddress).executeTransaction(oldStateUpdate, transaction)
       
       assert isSubrange(subrange, oldSateUpdate.range)
       assert isSubrange(subrange, newSateUpdate.range)

       limboCheckpoint: Checkpoint = {newSateUpdate, subrange)

       checkpointID: bytes32 = getCheckpointID(limboCheckpoint) # this will be the has of SU and range
       assert self.checkpoints[checkpointID].challengeableUntil == 0 #ensure the checkpoint is not already underway
       
       self.checkpoints[checkpointID].challengeableUntil = block.number + self.CHALLENGE_PERIOD
       self.limboCheckpoins[checkpointID] = oldStateUpdate

Cancelling a Limbo Exit
------------------------
Interface
^^^^^^^^^

.. code-block:: python

  def invalidateLimbo(limboCheckpoint: Checkpoint, transaction: bytes[1024], inclusionProof: bytes[1024]):

Description
^^^^^^^^^^^^^
A limbo checkpoint may be invaildated by demonstrating the inclusion of a conflicting spend of the limbo checkpoint's originating ``StateUpdate`` which has been included--because the limbo exit's claim that "this is the only possible thing which COULD have been included" is false.

Pseudocode
^^^^^^^^^^^
.. code-block:: python

  def invalidateLimbo(limboCheckpoint: Checkpoint, transaction: bytes[1024], inclusionProof: bytes[1024]):
       checkpointID: bytes32 = sha3(limboCheckpoint)
       originatingStateUpdate: StateUpdate = self.limboCheckpointOrigins[checkpointID]

       conflictingStateUpdate: StateUpdate = Predicate(originatingStateUpdate.state.predicateAddress).executeTransaction(originatingStateUpdate, transaction)
       
       assert CommitmentContract(self.COMMITMENT_ADDRESS).verifyInclusion(conflictingStateUpdate, inclusionProof) # make sure the conflict was included
       assert limboCheckpoint.stateUpdate.state != conflictingStateUpdate.stateUpdate.state # ensure they actually conflict

       clear(self.checkpoints[checkpointID]) # remove the checkpoint data
       clear(self.limboCheckpointOrigins[checkpointID]) # remove the limbo data
       clear(self.exitStatuses[checkpointID]) # remove any exit on the limbo checkpoint

Cancelling Checkpoints Predating Other Checkpoints
---------------------------------------
Interface
^^^^^^^^^^
.. code-block:: python
  def cancelLessRecentCheckpoint(olderCheckpoint: Checkpoint, newerCheckpoint: Checkpoint):

Description
^^^^^^^^^^^^^^
Checkpoints can only overwrite other checkpoints if they have a higher plaasma blocknumber than the previous checkpoint.  If someone tries to checkpoint something older than an existing overlapping checkpoint, it may be cancellecd.

Pseudocode
^^^^^^^^^^^
.. code-block:: python
  def cancelLessRecentCheckpoint(olderCheckpoint: Checkpoint, newerCheckpoint: Checkpoint):
       assert rangesIntersect(olderCheckpoint.range, newerCheckpoint.range) # make sure they intersect
       assert olderCheckpoint.stateUpdate.blocknumber < newerCheckpoint.stateUpdate.blocknumber # make sure the older one is older
       
       assert self.checkpointStatuses[newerCheckpointID].numChallenges == 0 # make sure the newer checkpoint is unchallenged
       newerCheckpointChallengeableUntil: uint256 = self.checkpointStatuses[newerCheckpointID].challengeableUntil
       assert challengeableUntil != 0 # make sure the newer checkpoint exitStatuses
       assert challengeableUntil # make sure the newer checkppoint is finalized

       clear(self.checkpointStatuses[olderCheckpointID]) # delete the checkpoint
       clear(self.exitsRedeemableAfter[olderCheckpointID]) # delete the exit

Exiting
==========
Exiting is the functionality which allows users to redeem money they have recieved on the plasma chain.  This entails playing out a provably safe dispute game for an "exit period."  Exits point at checkpoints, so that playing an exit game also requires playing the checkpoint game--an exit is only finalizable if its checkpoint has no challenges.

Public Variables
-----------------
.. code-block:: python
  
  exitableRanges: public(map(uint256, Range))
  exitsRedeemableAfter: public(map(bytes32, uint256))


``exitableRanges`` - ``uint256 -> Range``: the deposited ranges which have not yet been exited.  An exit is not valid and will be automatically prevented from finalizing if it includes a previously exited range.
``exitsRedeemableAfter`` - ``bytes32 -> uint256``: the contract's currently pending exit games, mapped from ``checkpointID: bytes32`` from the checkpoint being exited.  Maps to ``redeemableAfter: uint256``, the Ethereum block after which that exit is redeemable.

Beginning an Exit
---------------------
Interface
^^^^^^^^^^^
.. code-block:: python

  def beginExit(checkpoint: Checkpoint, exitabilityWitness: bytes[1024]):

Description
^^^^^^^^^^^^^
Users may begin an exit on any checkpoint, pending or finalized, though the exit's dispute period starts then, distinct from the checkpoint game.  This is the method which begins an exit game.

Pseudocode
^^^^^^^^^^^^
.. code-block:: python

  def beginExit(checkpoint: Checkpoint, exitabilityWitness: bytes[1024]):
       checkpointID: bytes32 = getCheckpointID(checkpoint)

       assert self.checkpointStatuses[checkpointID] != 0 # check the checkpoint is at least pending
       assert self.exits[exitID].redeemableAfter == 0 # check the exit is not already underway

       exitStateUpdate: StateUpdate = Checkpoint.stateUpdate
       assert Predicate(stateUpdate.state.predicateAddress).canBeginExit(checkpoint, exitabilityWitness)
       
       self.exits[exitID].redeemableAfter = block.number + self.EXIT_PERIOD

Finalizing an Exit
--------------------
Interface
^^^^^^^^^^

.. code-block:: python

  def finalizeExit(exit: Exit):

Description
^^^^^^^^^^^^^
Finalizing an exit is only possible if:
- the exit game's dispute period has elapsed.
- the exit has not been deleted.
- the exit's checkpoint has no pending challenges.
Under these conditions, the exit is finalized, its money sent to the predicate, and the predicate's finalization functionality is called.

Pseudocode
^^^^^^^^^^^^
.. code-block:: python

  def finalizeExit(checkpoint: Checkpoint):
       checkpointID: bytes32 = getCheckpointID(checkpoint)

       redeemableAfter: uint256 = self.exitsRedeemableAfter[checkpointID]
       assert redeemableAfter != 0 # make sure the exit wasn't deleted
       assert block.number > redeemableAfter # make sure the dispute period has elapsed

       status: CheckpointStatus = self.checkpoints[checkpointID]
       assert status.numChallenges == 0
       assert block.number > status.challengeableUntil

       assert self.checkpoints[checkpointID].numChallenges == 0
       exitAmount: uint256 = checkpointedStateUpdate.end - checkpointedStateUpdate.start
       ERC20(self.TOKEN_ADDRESS).approve(checkpointStateUpdate.state.predicateAddress, exitAmount)
       Predicate(checkpointedStateUpdate.state.predicateAddress).onFinalizeExit(checkpoint)

Cancelling Spent Exits
-----------------------
Interface
^^^^^^^^^^
.. code-block:: python

  def cancelDeprecatedExit(checkpoint: Checkpoint, transaction: bytes[1024], inclusionProof: bytes[1024]):

Description
^^^^^^^^^^^^
If a state update has been included which has a valid transaction from a state being exited, that exit is invalid.  Thus, the ``cancelDeprecatedExit`` method checks this and deletes the exit if it sees that included state.

Pseudocode
^^^^^^^^^^^
.. code-block:: python

  def cancelDeprecatedExit(checkpoint: Checkpoint, transaction: bytes[1024], inclusionProof: bytes[1024]):
       newStateUpdate: StateUpdate = Predicate(checkpoint.stateUpdate.state.predicateAddress).executeTransaction(checkpoint.stateUpdate, transactiom)
       assert CommitmentContract(self.COMMITMENT_ADDRESS).verifyInclusion(newStateUpdate, inclusionProof)
       assert rangesIntersect(newStateUpdate.range, checkpoint.range)
       clear(self.exitStatuses[checkpointID])

Challenges
===========

A challenge claims that a pending checkpoint is invalid because a previously committed state update has not been deprecated (transacted from).  If this is indeed the case, then it is unsafe to further spend the coin and the operator is malicious, so the user will challenge with an exit.  If the challenging exit has indeed not been spent, it may not be deleted, and the checkpoint's ``numChallenges`` will permanently increase, making it and its exits invalid.

Structs
--------

.. code-block:: python

  struct Challenge: 
       challengingExit: Checkpoint
       challengedCheckpont: Checkpoint

Descriptions
^^^^^^^^^^^^^
``Challenge``: the details of a challenge.

Public Variables
-----------------
.. code-block:: python

  challengeStatuses: public(map(bytes32, bool))

Descriptions
^^^^^^^^^^^^^^
The status of challenges (whether they are currently active) are stored on-chain.  They are referenced by a ``challengeID: bytes32`` which is calculated as ``hash(challengingExitID, challengedCheckpointID)``.

Challenging a Checkpoint
--------------------------
Interface
^^^^^^^^^^
.. code-block:: python
  def challengeCheckpoint(desiredChallenge: Challenge)
       challengingCheckpointID: bytes32 = sh3(desiredChallenge.challengingExit) # note this is used to reference exit information since an exit ID is its checkpoint ID
       challengedCheckpointID: bytes32 = sha3(desiredChallenge.challengedCheckpont)
       challengeID: bytes32 = sha3(challengingExitID, challengedCheckpointID)
       assert self.challengeStatuses[challengeID] == False # ensure chllenge not already underway

       assert block.number <= self.desiredChallenge.challengingExit.challengeableUntil

       challengedStateUpdate: StateUpdate = self.limboCheckpointOrigins[challengedCheckpointID]
       if (challengedStateUpdate != EMPTY_STATEUPDATE): # if this is a limbo checkpoint being challenged
              assert challengingExit.stateUpdate.blocknumber < challengedStateUpdate.blocknumber # then the challenge must come from before the limbo origin

       self.challenges[challengingCheckpointID] = True # challenge is now active
       self.checkpoints[challengedCheckpointID].numChallenges += 1 # the challenged checkpoint has one more challenge now


Description
^^^^^^^^^^^^
To challenge a checkpoint, we provide 

Pseudocode
^^^^^^^^^^^^
.. code-block:: python

  def challengeCheckpoint(desiredChallenge: Challenge)
       challengeID: bytes32 = sha3(sha3(desiredChallenge.challengingExit), sha3(desiredChallenge.challengedCheckpont)
       assert self.challenges[challengeID].isActive == False

       challengingExitID: bytes32 = sh3(desiredChallenge.challengingExit)

       assert block.number <= self.desiredChallenge.challengingExit.challengeableUntil

       assert self.challenges[] is unactive

       self.challenges[challengeID].isActive = True
       self.checkpoints[checkpointID].numChallenges += 1

Removing a Challenge
---------------------
Interface
^^^^^^^^^^^^
.. code-block:: python

  def removeChallenge(challenge: Challenge):

Description
^^^^^^^^^^^^^
If an exit is successfully cancelled (deleted), then its checkpoint was invalid and this ``removeChallenge`` method may be called to decrement the challenged checkpoint's ``numChallenges``.

Pseudocode
^^^^^^^^^^^
.. code-block:: python

  def removeChallenge(challenge: Challenge):
       assert challenge is active
       aassert exit has been deleted
       decrement numChallenges for the checkpoint