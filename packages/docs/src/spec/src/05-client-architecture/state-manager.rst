############
StateManager
############

***********
Description
***********
``StateManager`` primarily handles incoming transactions that modify the current and historical state. ``StateManager`` effectively acts as a wrapper around `StateDB`_ but also makes some calls to `HistoryManager`_.

-------------------------------------------------------------------------------


***
API
***

Data Structures
===============

StateQuery
----------

.. code-block:: typescript

   interface StateQuery {
     plasmaContract: string
     predicateAddress: string
     start?: number
     end?: number
     method: string
     params: string[]
     filter: Expression
   }

Description
^^^^^^^^^^^
Represents a query for some information about the current state.

Fields
^^^^^^
1. ``plasmaContract`` - ``string``: Address of the plasma contract to query. Clients may track multiple plasma contracts, so this parameter is necessary to resolve the correct data.
2. ``predicateAddress`` - ``string``: Address of the predicate to query.
3. ``start`` - ``number``: Start of the range to query. If not provided, will default to the 0.
4. ``end`` - ``number``: End of the range to query. If not provided, will default to the max range value.
5. ``method`` - ``string``: Name of the method to call.
6. ``params`` - ``string[]``: List of parameters to the call.
7. ``filter?`` - ``Expression``: An `Expression`_ to use to filter results. May be omitted to return all results.


-------------------------------------------------------------------------------

StateQueryResult
----------------

.. code-block:: typescript

   interface StateQueryResult {
     stateUpdate: StateUpdate
     result: string[]
   }

Description
^^^^^^^^^^^
Element of the list of results returned when a client makes a state query.

Fields
^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: ``StateUpdate`` object to which the result pertains.
2. ``result`` - ``string[]``: Result values of the query corresponding to the output values described in the `Predicate API`_.


-------------------------------------------------------------------------------

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

For example, we may have a valid history for the ranges ``(0, 50)`` and a transaction that sends ``(0, 100)``. We can assert that the transaction is valid for ``(0, 50)`` but cannot make the same assertion for ``(50, 100)``.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: `Transaction`_ to execute against the verified state.

Returns
^^^^^^^
``Promise<{ stateUpdate: StateUpdate, validRanges: Range[] }>``: The `StateUpdate`_ created as a result of the transaction and the list of ranges over which the state update has been validated.

-------------------------------------------------------------------------------


ingestHistoryProof
------------------

.. code-block:: typescript

   async function ingestHistoryProof(
     historyProof: HistoryProof
   ): Promise<void>

Description
^^^^^^^^^^^
Validates a given ``HistoryProof``, which consists of elements that are either `deposits`_ ("Deposit Proof Elements"), `transactions`_ ("State Update Proof Elements"), or `state updates`_ that prove a given range was *not* included in a specific block ("Exclusion Proof Elements").

Parameters
^^^^^^^^^^
1. ``historyProof`` - ``HistoryProof``: A ``HistoryProof`` to validate.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the proof has been applied or rejected.

-------------------------------------------------------------------------------


queryState
----------

.. code-block:: typescript

   async function queryState(query: StateQuery): Promise<StateQueryResult[]>

Description
^^^^^^^^^^^
Performs a `query on the local state`_.

Parameters
^^^^^^^^^^
1. ``query`` - ``StateQuery``: A `StateQuery`_ object with information about what state to query.

Returns
^^^^^^^
``Promise<StateQueryResult[]>``: A `StateQueryResult`_ object for each `state update`_ that passed the filter provided in the query.


.. References

.. _`Predicate API`: ../01-core/state-system.html#predicate-api
.. _`transaction`:
.. _`transactions`: ../01-core/state-system.html#transactions
.. _`state update`:
.. _`state updates`: ../01-core/state-system.html#state-updates
.. _`range`: ../01-core/state-object-ranges.html
.. _`state object`:
.. _`state objects`: ../01-core/state-system.html#state-objects
.. _`Transaction`: ../01-core/state-system.html#Transaction
.. _`StateUpdate`: ../01-core/state-system.html#StateUpdate
.. _`deposits`: ../03-client/deposit-generation.html
.. _`StateDB`: ./state-db.html
.. _`HistoryManager`: ./history-manager.html
.. _`Expression`: ./query-expressions.html
.. _`query on the local state`: ./state-queries.html
.. _`This behavior is allowed by construction`: TODO

