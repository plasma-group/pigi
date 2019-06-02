#############################
Limbo Exit Predicate Standard
#############################

***********
Explanation
***********

An important attack on plasma systems is for the operator to start withholding blocks after they have been sent a transaction.  For instance, if Alice signs off agreeing to send to Bob, but the operator does not reveal the corresponding Bob ownership ``StateUpdate``, then there is insufficient information to exit because Alice's exit can be deprecated by her signature, but Bob doesn't have an inclusion proof to exit.

One solution is *confirmation signatures*, in which Alice does not create a signature until she sees inclusion of the Bob ownership state.  However, this has bad UX properties--for one, Alice has to wait until the next block before she can sign, which means she cannot simply send a signature and go offline. Further, it requires an out-of-protocol authentication process: how does the operator know to include the Bob ownership before Alice has signed?

Limbo exits are a better way to solve this problem.  They allow Alice to sign a transaction before the block is submitted, go offline, and have Bob recieve the coin at a later time, without reducing safety or extending the exit period.

Intuitively, limbo exits work by allowing Alice to exit her ownership state *on Bob's behalf*. A limbo-compatible ownership predicate allows Alice to exit her ownership state "to Bob."  Once she does this, the ``finalizeExit`` call will send the money to Bob instead of Alice. So, if Alice agrees to a limbo exit, it cannot be deprecated by her spend to Bob.

There are two ways to deprecate a limbo exit.  One is to show a conflicting spend other than the one the limbo exit claims to be valid: for example, if Alice limbo exits to Bob, this can be deprecated by providing an alternate spend, e.g. from Alice to Carol.  The other way is to show that the limbo "target" is itself deprecated: for example, if Alice sends to Bob, and Bob sends to Carol, a limbo exit from Alice to Bob may be cancelled by showing Bob's transaction to Carol.

Note that this all means limbo exits have a stronger notion of state than the deposit contract requires--instead of just dealing with deprecation, they must have a notion of transactions and state transitions.  Luckily, this is just generally a great idea--Plasma Group will support transaction and limbo functionality across all predicates we create.  This page will document the standard interface which predicates supporting limbo functionality must follow, so that it doesn't have to be reecreated for different predicates.

-------------------------------------------------------------------------------

***
API
***

Structs
=======

LimboStatus
-----------

.. code-block:: solidity

   struct LimboStatus {
       bytes32 targetId;
       bool wasReturned;
   }

Description
^^^^^^^^^^^
Represents the status of a limbo exit.

Fields
^^^^^^
1. ``targetId`` - ``bytes32``: Hash of the target ``StateUpdatee`` being limbo exited "to".
2. ``wasReturned`` - ``bool``: Whether the state being limbo exited to cooperatively agreed to return the limbo exit back to the limbo source.

Public Variables
================

limboTargets
------------

.. code-block:: solidity

   mapping (bytes32 => LimboStatus) public limboExits;

Description
^^^^^^^^^^^
This mapping maps the limbo exit IDs to their current status.

Rationale
^^^^^^^^^
This is the storage on which limbo exit logic is based.  If Alice is limbo exiting to Bob, we record the Bob ownership in ``targetId`` field, and if Bob cooperatively decides to return the outcome of the exit to Alice, we store that in ``wasReturned``.


Events
======

CheckpointStarted
-----------------

.. code-block:: solidity

   event LimboTargeted(
       Checkpoint limboExitSource,
       StateUpdate limboExitTarget
   );

Description
^^^^^^^^^^^
Emitted whenever a deposit contract exit is targeted as a 

Fields
^^^^^^
1. ``limboExitSource`` - ``Checkpoint``: The exit being converted into a limbo exit.
2. ``limboExitTarget`` - ``StateUpdpate``: The "target" of a limbo exit. A transaction resulting in the ``limboExitTarget`` cannot be used to deprecate ``limboExitSource`` once this event has been emitted.

-------------------------------------------------------------------------------

limboExitReturned
-----------------

.. code-block:: solidity

   event limboExitReturned(
       Checkpoint limboExitSource,
   );

Description
^^^^^^^^^^^
Emitted whenever a deposit contract exit is targeted as a 

Fields
^^^^^^
1. ``limboExitSource`` - ``Checkpoint``: The exit returned by the limbo target to the source state.

Methods
=======

targetLimboExit
---------------
targetLimboExit(originCheckpoint, transaction, target)

.. code-block:: targetLimboExit

   function targetLimboExit(
       Checkpoint _sourceExit,
       Transaction _transaction,
       bytes _witness
       StateUpdate _limboTarget
   ) public

Description
^^^^^^^^^^^
Allows a user to convert a normal exit into a limbo exit by "targeting" a transaction which they made but cannot prove inclusion of.

Parameters
^^^^^^^^^^
1. ``_sourceExit`` - ``Checkpoint``: the exit being converted into a limbo exit
2. ``_transaction`` - ``Transaction``: The transaction from the ``_sourceExit.stateUpdate``.
3. ``_witness`` - ``bytes``: the witness which proves the transaction validity.
4. ``_limboTarget`` - ``StateUpdate``: the output of the transaction being verified.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the transaction is valid by calling ``verifyTransaction(_sourceExit.stateUpdate, _transaction, _witness, _limboTarget``.
- **MUST** ensure the ``_limboTarget.range`` is a subrange of the ``_sourceExit.subRange``.
- **MUST** ensure the ``_sourceExit`` has not already been made a limbo exit.
- **MUST** call ``onTargetedForLimboExit(_sourceExit, _target)`` on the ``_target`` predicate.
- **MUST** set the ``limboTargets`` mapping with a key of the ID of ``_sourceExit`` and value of ``hash(_limboTarget)``
- **MUST** emit a ``LimboTargeted`` event.

Justification
^^^^^^^^^^^^^
This is the base function which converts a regular exit into a limbo exit.  Both the source and target predicates must support the limbo interface outlined here for it to work.  For example, if Alice limbo exits to a Bob and Carol multisig, she exits her ownership, then limbo targets the mutisig with her transaction.  This is because the ownership ``targetLimboExit`` method subcalls the ``onTargetedForLimboExit`` of the mutisig.

Functions

onTargetedForLimboExit
----------------------

.. code-block:: solidity

   function onTargetedForLimboExit(
       Checkpoint _sourceExit,
       StateUpdate _limboTarget
   ) public

Description
^^^^^^^^^^^
Hook allowing for the target predicate to initiate any custom logic needed for stateful limbo exits.

Parameters
^^^^^^^^^^
1. ``_sourceExit`` - ``Checkpoint``: the exit being converted into a limbo exit
2. ``_limboTarget`` - ``StateUpdate``: the output of the transaction being verified.

Requirements
^^^^^^^^^^^^
N/A

Justification
^^^^^^^^^^^^^
This method will simply return true for basic predicates like ownership or multisigs, but allows for more complex stateful exit subgames to be initiated if they need to happen during limbo exits.

proveDeprecation
----------------

.. code-block:: solidity

   function proveExitDeprecation(
       Checkpoint _deprecatedExit,
       Transaction _transaction,
       bytes _witness,
       StateUpdate _postState
   ) public

Description
^^^^^^^^^^^
This function serves the same purpose as regular state transition predicates, on the condition that the ``_deprecatedExit`` is not a limbo exit.

Parameters
^^^^^^^^^^
1. ``_deprecatedExit`` - ``Checkpoint``: the deprecated checkpoint being exited.
2. ``_transaction`` - ``Transaction``: The transaction which deprecates the exit.  Follows the standard format as outlined in the transaction generation page in Secion #03.
3. ``_witness`` - ``bytes``: Additional witness data which authenticates the transaction validity, e.g. a signature. Defined on a per-predicate basis.
4. ``_postState`` - ``StateUpdate``: the output of the transaction to be verified.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the ``_deprecatedExit`` is not a limbo exit by checking the ``limboTargets`` mapping.
- **MUST** check that the transaction is valid with a call to ``verifyTransaction(_deprecatedExit.stateUpdate, _transaction, _witness, _postState`` on the source predicate (i.e. this predicate itself).
- **MUST** check that the ``_postState.range`` intersects the ``_deprecatedExit.subrange``
- **MUST** call ``deprecateExit(_deprecatedExit)`` on the ``_deprecatedExit.stateUpdate.plasmaContractAddress``.

Justification
^^^^^^^^^^^^^
If the exit is not a limbo exit, deprecation may occur normally, by proving an intersecting transaction spending the exit.

proveTargetDeprecation
----------------

.. code-block:: solidity

   function proveTargetDeprecation(
       Checkpoint _limboSource,
       StateUpdate _limboTarget
       Transaction _transaction,
       bytes _witness,
       StateUpdate _postState
   ) public

Description
^^^^^^^^^^^
This function allows a limbo exit to be cancelled if the ``target`` has been spent.

Parameters
^^^^^^^^^^
1. ``_limboSource`` - ``Checkpoint``: the limbo exit whose target state update is deprecable.
2. ``_limboTarget`` - ``StateUpdate`` the target of the limbo exit which is deprecable.
3. ``_transaction`` - ``Transaction``: The transaction which spends from the ``_limboTarget``
4. ``_witness`` - ``bytes``: Additional witness data which authenticates the transaction validity.
5. ``_postState`` - ``StateUpdate``: the output of the transaction on the target.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the ``_limboSource`` is indeed a limbo exit with the ``hash(_limboTarget)`` in its ``limboTargets`` value.
- **MUST** check that the transaction is valid with a call to the **target** predicate's ``verifyTransaction(_deprecatedExit.stateUpdate, _transaction, _witness, _postState``.
- **MUST** check that the ``_postState.range`` intersects the ``_limboTarget.range``.
- **MUST** call ``deprecateExit(_limboSource)`` on the ``_limboSource.stateUpdate.plasmaContractAddress``.
- **MUST** clear the limbo exit from the ``limboTargets`` mapping.

Justification
^^^^^^^^^^^^^
An example usage of this would be: if Alice->Bob->Carol, and Alice limbo exits with Bob ownership as the target, this function will be used to cancel the exit by showing Bob->Carol.

proveSourceDoubleSpend
---------------------------------

.. code-block:: solidity

   function proveSourceDoubleSpend(
       Checkpoint _limboSource,
       StateUpdate _limboTarget
       Transaction _conflictingTransaction,
       bytes _conflictingWitness,
       StateUpdate _conflictingPostState
   ) public

Description
^^^^^^^^^^^
This function allows a limbo exit which has an alternate transaction spending from the source to be deprecated.

Parameters
^^^^^^^^^^
1. ``_limboSource`` - ``Checkpoint``: the limbo exit which has a double spend which conflicting its target.
2. ``_limboTarget`` - ``StateUpdate`` the target of the limbo exit which has a conflicting spend
3. ``_conflictingTransaction`` - ``Transaction``: The transaction which spends from the ``_limboTarget``
4. ``_conflictingWitness`` - ``bytes``: Additional witness data which authenticates the transaction validity.
5. ``_conflictingPostState`` - ``StateUpdate``: the output of the transaction on the source which has a different ``state`` than the target.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the ``_limboSource`` is indeed a limbo exit with the ``hash(_limboTarget)`` in its ``limboTargets`` value.
- **MUST** check that the transaction is valid with a call to the **source** predicate's ``verifyTransaction(_deprecatedExit.stateUpdate, _transaction, _witness, _postState``.
- **MUST** check that the ``_postState.range`` intersects the ``_limboTarget.range``.
- **MUST** check that the ``_postState.state`` is not equal to the ``_conflictingPostState.state``.
- **MUST** call ``deprecateExit(_limboSource)`` on the ``_limboSource.stateUpdate.plasmaContractAddress``.
- **MUST** clear the limbo exit from the ``limboTargets`` mapping.

Justification
^^^^^^^^^^^^^
An example usage of this would be: if Alice->Bob->Carol, and Alice limbo exits with Mallory ownership as the target, this function will be used to cancel the exit by showing Alice->Bob--a double spend.

returnLimboExit
---------------

.. code-block:: solidity

   function returnLimboExit(
       Checkpoint _limboSource,
       StateUpdate _limboTarget
       bytes _witness
   ) public

Description
^^^^^^^^^^^
This function allows the source state of a limbo exit to agree to give the money back to the source state of the limbo exit.

Parameters
^^^^^^^^^^
1. ``_limboSource`` - ``Checkpoint``: the limbo exit which is being returned
2. ``_limboTarget`` - ``StateUpdate`` the target of the limbo exit which has a conflicting spend
3. ``_witness`` - ``bytes``: Arbitrary witness data used by the target predicate to authenticate the return. Not necessarily the same as a transaction witness.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the ``_limboSource`` is indeed a limbo exit with the ``hash(_limboTarget)`` in its status.
- **MUST** ensure that the target state is allowing the return by calling the target predicate's ``canReturnLimboExit(_limboSource, _limboTarget, _witness)``
- **MUST** set ``wasReturned`` to true for the limbo exit's status.
- **MUST** emit a ``limboExitReturned`` event.

Justification
^^^^^^^^^^^^^
If Alice sends a transaction to Bob and then observes block withholding, she must limbo exit with Bob as the target. However, because of the ``proveSourceDoubleSpend`` method, Bob cannot guarantee until the exit period has passed that Alice will not sign a conflicting message and deprecate the exit.  Thus, we want Bob to be able to return the exit to Alice, perhaps conditionally on some payment which he can validate without waaaiting a full exit period


canReturnLimboExit
------------------

.. code-block:: solidity

   function canReturnLimboExit(
       Checkpoint _limboSource,
       StateUpdate _limboTarget
       bytes _witness
   ) public returns (bool)

Description
^^^^^^^^^^^
This function allows the target state of a limbo exit to authenticate a guaranteed return to the source as described above.

Parameters
^^^^^^^^^^
1. ``_limboSource`` - ``Checkpoint``: the limbo exit which requesting to be returned.
2. ``_limboTarget`` - ``StateUpdate`` the target of the limbo exit which has a conflicting spend
3. ``_witness`` - ``bytes``: Arbitrary witness data used by the target predicate to authenticate the return. Not necessarily the same as a transaction witness.

Requirements
^^^^^^^^^^^^
- **MUST** handle some sort of authentication which provides the target state a guarantee that it will not be returnable without permission.

Justification
^^^^^^^^^^^^^
See justification for ``returnLimboExit`` above, which explains this function.

finalizeExit
------------

.. code-block:: solidity

   function finalizeExit(
       Checkpoint _exit
   ) public

Description
^^^^^^^^^^^
Finalizes an exit which is either not a limbo exit or has been returned

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: the exit being finalized.

Requirements
^^^^^^^^^^^^
- **MUST** check that the exit is either:
    - **not** a limbo exit, or
    - is a limbo exit which ``wasReturned``.
- **MUST** call ``finalizeExit`` on the deposit contract.
- **MUST** handle the resulting ERC20 transfer of the exit amount in some way.

Justification
^^^^^^^^^^^^^
If an exit is not a limbo exit or was returned by the target state, we execute a normal exit procedure for the exited ``Checkpoint``.

finalizeLimboExit
-----------------

.. code-block:: solidity

   function finalizeExit(
       Checkpoint _exit,
       StateUpdte _target
   ) public

Description
^^^^^^^^^^^
Finalizes a successful, unreturned limbo exit.

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: the limbo exit being finalized.
2. ``_target`` - ``StateUpdate``: the target of the limbo exit.

Requirements
^^^^^^^^^^^^
- **MUST** ensure that the ``_limboSource`` is indeed a limbo exit with the ``hash(_limboTarget)`` in its status.
- **MUST** ensure that the limbo exit was **not** returned.
- **MUST** call ``finalizeExit`` on the deposit contract.
- **MUST** transfer ALL ERC20 funds from the deposit contract to the target predicate.
- **MUST** call ``onFinalizeTargetedExit`` on the target predicate.

Justification
^^^^^^^^^^^^^
If an exit is a limbo exit which was not returned, the source predicate finalizes the exit, sends it to the target, and allows the target to handle the receipt.

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

Parameters
^^^^^^^^^^
1. ``_exit`` - ``Checkpoint``: the limbo exit being finalized.
2. ``_target`` - ``StateUpdate``: the target of the limbo exit.

Requirements
^^^^^^^^^^^^
- **MUST** handle the money recieved from the exit as it pertains to this target.

Justification
^^^^^^^^^^^^^
The target of a limbo exit must be able to handle the money arbitrarily, this logic is called by the source predicate on the target to perform that logic.


.. References
