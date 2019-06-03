####################################
Transaction-based Predicate Standard
####################################

***********
Description
***********

Most developers are more familiar with a transaction-based model of cryptocurrencies, where state transitions as the result of transactions form the basis for computation. Our client and operator implementations also work this way--it's really a great model!  The transaction-based predicate standard helps us to do this cleanly, by providing a wrapper which interprets transactions in the context of deprecation and disputes.

In essence, the way to enable this is: if a transaction from one state has been authenticated (e.g. signed by its single owner or signed by the multiple participants of a multisig), it must be deprecable using that transaction.

*********************
Transaction Execution
*********************

verifyTransaction
-----------------

.. code-block:: solidity

   function verifyTransaction(
       StateUpdate _preState,
       Transaction _transaction,
       bytes _witness,
       StateUpdate _postState
   ) public

Description
^^^^^^^^^^^
The main thing that must be defined for a state transition model is this ``verifyTransaction`` function which accepts a ``preState`` state update, and verifies against a ``transaction`` and ``witness`` that a given ``postState`` is correct.

Parameters
^^^^^^^^^^
1. ``_preState`` - ``StateUpdate``: the state update which the transaction is being applied on.
2. ``_transaction`` - ``Transaction``: The transaction being applied.  Follows the standard format as outlined in the transaction generation page in Section #03.
3. ``_witness`` - ``bytes``: Additional witness data which authenticates the transaction validity, e.g. a signature. Defined on a per-predicate basis.
4. ``_postState`` - ``StateUpdate``: the output of the transaction to be verified.

Requirements
^^^^^^^^^^^^
- Predicates **MUST** define a custom ``_witness`` struct for their particular type of state.
- Predicates **MUST** disallow state transitions which pass verification without some interested party's consent, e.g. the owner's signature

***********
Deprecation
***********

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
If a state transition away from a given state update exists, then it is not valid to exit that state--it should be deprecated!  This function allows a user to demonstrate this to the predicate so that it may cancel an exit

Parameters
^^^^^^^^^^
1. ``_deprecatedExit`` - ``Checkpoint``: the deprecated checkpoint being exited.
2. ``_transaction`` - ``Transaction``: The transaction which deprecates the exit.  Follows the standard format as outlined in the transaction generation page in Section #03.
3. ``_witness`` - ``bytes``: Additional witness data which authenticates the transaction validity, e.g. a signature. Defined on a per-predicate basis.
4. ``_postState`` - ``StateUpdate``: the output of the transaction to be verified.

Requirements
^^^^^^^^^^^^
- **MUST** check that the transaction is valid with a call to ``verifyTransaction(_deprecatedExit.stateUpdate, _transaction, _witness, _postState``.
- **MUST** check that the ``_postState.range`` intersects the ``_deprecatedExit.subrange``
- **MUST** call ``deprecateExit(_deprecatedExit)`` on the ``_deprecatedExit.stateUpdate.state.predicateAddress``.


.. References
