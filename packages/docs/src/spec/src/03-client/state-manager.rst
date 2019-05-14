############
StateManager
############

***********
Description
***********
``StateManager`` primarily handles incoming transactions that modify the current and historical state. ``StateManager`` effectively acts as a wrapper around `StateDB`_ but also makes some calls to `HistoryManager`_.

***
API
***

Methods
=======

executeTransaction
------------------

.. code-block:: typescript

   async function executeTransaction(
     transaction: Transaction
   ): Promise<{ stateUpdate: StateUpdate, validRanges: Range[] }>

Description
^^^^^^^^^^
Executes a `transaction`_ against the current verified state and returns the resulting `state update`_.

Transactions reference a `range`_ of `state objects`_ that they're attempting to modify. It's possible that we only have the full valid history for some of the referenced state objects but not others. `This behavior is allowed by construction`_. As a result, this method also returns the list of ranges over which the transaction can be considered "valid".

For example, we may have a valid history for the ranges `(0, 50)` and a transaction that sends `(0, 100)`. We can assert that the transaction is valid for `(0, 50)` but cannot make the same assertion for `(50, 100)`.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: `Transaction`_ to execute against the verified state.

Returns
^^^^^^^
``Promise<{ stateUpdate: StateUpdate, validRanges: Range[] }>``: The `StateUpdate`_ created as a result of the transaction and the list of ranges over which the state update has been validated.

ingestHistoryProof
------------------

.. code-block:: typescript

   async function ingestHistoryProof(
     historyProof: HistoryProof
   ): Promise<void>

Description
^^^^^^^^^^^
Validates a given ``HistoryProof``, which consists of elements that are either `deposits`_ ("deposit elements"), `transactions`_ ("transaction elements"), or `state updates`_ that prove a given range was *not* included in a specific block ("non-inclusion elements").

Parameters
^^^^^^^^^^
1. ``historyProof`` - ``HistoryProof``: A ``HistoryProof`` to validate.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the proof has been applied or rejected.

