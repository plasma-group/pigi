###############
PredicatePlugin
###############

***********
Description
***********
Clients need a way to execute state transitions for a given predicate. However, it's too slow and complex to execute these state transitions in a virtual version of the EVM. As a result, Predicates **MUST** supply client-side code, called a *predicate plugin*, that can compute state transitions. Predicate plugins **MUST** conform a standard interface as described below.

*******************
Information Sources
*******************
Predicate plugins have access to various external sources of information. Plugins can use this information for various reasons, including the execution of state transitions.  All information available to a plugin **MUST** also be available to the corresponding predicate contract on Ethereum.

Ethereum Contract Queries
=========================
Predicate plugins have access to any information available on Ethereum. As plugins are effectively native implementations of their contract counter-parts, plugins should be careful not to rely on information not available to the contract (like event logs).

Plasma State Queries
====================
Predicate contracts on Ethereum can be fed information about the state of the plasma chain. Predicate plugins are therefore given a reference to `StateManager`_ and `HistoryManager`_ that permit the plugin to make queries about the existence (or non-existence) of a given `StateUpdate`_ in the plasma chain. 


-------------------------------------------------------------------------------

***
API
***

Methods
=======

transitionStateUpdate
---------------------

.. code-block:: typescript

   async function transitionStateUpdate(
     input: StateUpdate,
     transaction: Transaction
   ): Promise<StateUpdate>

Description
^^^^^^^^^^^
Executes a transaction and returns the resulting state upate.

Parameters
^^^^^^^^^^
1. ``input`` - ``StateUpdate``: Previous `StateUpdate`_ that the transaction acts upon.
2. ``transaction`` - ``Transaction``: `Transaction`_ to execute.

Returns
^^^^^^^
``Promise<StateUpdate>``: Resulting `StateUpdate`_ created by the application of the transaction.


-------------------------------------------------------------------------------

queryState
----------

.. code-block:: typescript

   async function queryState(stateUpdate: StateUpdate, method: string, parameters: string[]): Promise<string[]>

Description
^^^^^^^^^^^
Performs a query on a given state update.

Parameters
^^^^^^^^^^
1. ``stateUpdate`` - ``StateUpdate``: The `StateUpdate`_ object to perform a query on.
2. ``method`` - ``string``: Name of the query method to call.
3. ``parameters`` - ``string[]``: Additional parameters to the query.

Returns
^^^^^^^
``string[]``: List of return values based on the predicate's `API`_.


-------------------------------------------------------------------------------

getAdditionalHistoryProof
-------------------------

.. code-block:: typescript

   async function getAdditionalHistoryProof
     transaction: Transaction
   ): Promise<HistoryProof>

Description
^^^^^^^^^^^
Predicates may specify rely on the existence (or non-existence) of a given `StateUpdate`_ in the plasma chain. Whenever this is the case, the client must `verify the history proof`_ for that ``StateUpdate``. This method allows a predicate to specify any additional history proof information that may be necessary to verify these extra ``StateUpdate`` objects.
 

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: The `Transaction`_ that may require additional proof data.

Returns
^^^^^^^
``Promise<HistoryProof>``: The `HistoryProof`_ object that contains the extra proof data. May be an empty array if the transaction requires no additional history proof data.


-------------------------------------------------------------------------------

canReplaceTransaction
---------------------

.. code-block:: typescript

   async function canReplaceTransaction(
     oldTransaction: Transaction,
     newTransaction: Transaction
   ): Promise<boolean>

Description
^^^^^^^^^^^
Plasma blocks are composed of commitments to `StateUpdate`_ objects. Each ``StateUpdate`` is computed from a previous ``StateUpdate`` and a `Transaction`_. It's possible for one transaction to generate the same ``StateUpdate`` as another transaction, and therefore still be a valid component of a `history proof`_, but have significantly less overhead than the other. Clients may wish to "replace" one transaction with another to reduce proof overhead.

Predicates can define an arbitrary heuristic within this method to determine if one transaction is preferable to another.

Parameters
^^^^^^^^^^
1. ``oldTransaction`` - ``Transaction``: Original `Transaction`_ to be replaced.
2. ``newTransaction`` - ``Transaction``: New `Transaction`_ to replace the original.

Returns
^^^^^^^
``boolean``: ``true`` if the newer transaction should replace the older one, ``false`` otherwise.


-------------------------------------------------------------------------------

onTransitionFrom
----------------

.. code-block:: typescript 

   async function onTransitionFrom(
     transaction: Transaction,
     from: StateUpdate,
     to: StateUpdate,
     verifiedRanges: Range[]
   ): Promise<void>

Description
^^^^^^^^^^^
Hook called whenever a `StateUpdate`_ locked by the predicate has been transitioned away from. Predicates may wish to use this hook to carry out some internal logic.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: The `Transaction`_ which executed a state transition.
2. ``from`` - ``StateUpdate``: The old `StateUpdate`_ transitioned away from by the transaction.
3. ``to`` - ``StateUpdate``: The new `StateUpdate`_ created by the transaction.
4. ``verifiedRanges`` - ``Range[]``: Parts of the range described by ``to`` with a `fully verified history`_. It's possible that a transaction creates a `StateUpdate`_ with only a partially verified history. For example, we may have a transaction that sends state objects ``(0, 100)`` but have only verified ``(0, 50)``. This is considered `valid behavior`_ as we simply ignore ``(50, 100)`` until we have its full history.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the predicate has executed some logic for the hook.


-------------------------------------------------------------------------------

onTransitionTo
--------------

.. code-block:: typescript 

   async function onTransitionTo(
     transaction: Transaction,
     from: StateUpdate,
     to: StateUpdate,
     verifiedRanges: Range[]
   ): Promise<void>

Description
^^^^^^^^^^^
Hook called whenever a `Transaction`_ creates a new `StateUpdate`_ locked by the predicate. Predicates may wish to use this hook to carry out some internal logic.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: The `Transaction`_ which executed a state transition.
2. ``from`` - ``StateUpdate``: The old `StateUpdate`_ transitioned away from by the transaction.
3. ``to`` - ``StateUpdate``: The new `StateUpdate`_ created by the transaction.
4. ``verifiedRanges`` - ``Range[]``: Parts of the range described by ``to`` with a `fully verified history`_. It's possible that a transaction creates a `StateUpdate`_ with only a partially verified history. For example, we may have a transaction that sends state objects ``(0, 100)`` but have only verified ``(0, 50)``. This is considered `valid behavior`_ as we simply ignore ``(50, 100)`` until we have its full history.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the predicate has executed some logic for the hook.


.. _`API`: TODO
.. _`web3`: TODO
.. _`StateUpdate`: TODO
.. _`Transaction`: TODO
.. _`StateManager`: TODO
.. _`HistoryManager`: TODO
.. _`HistoryProof`: TODO
.. _`history proof`:
.. _`verify the history proof`:
.. _`fully verified history`: TODO
.. _`valid behavior`: TODO

