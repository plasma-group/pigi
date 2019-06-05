#####################
Transaction Ingestion
#####################

*****************************
Incoming Transaction Endpoint
*****************************
Clients send transactions to the operator via the `send transaction RPC method`_, which is then received by the `RPC server`_. The RPC server then pipes the transaction to the `operator's state manager`_.

********************
Transaction Decoding
********************
Before the operator can execute the transaction, it **MUST** first check that the transaction is `correctly formatted`_ by attempting to decode the transaction.

If decoding fails, the operator **MUST** return an `Invalid Transaction Encoding`_ error response.

*********************
Transaction Execution
*********************
Once the operator has determined that the transaction was correctly encoded, they can attempt to execute the transaction against the local state.

State Update Resolution
=======================
The operator **MUST** resolve the set of state updates that the transaction operates on. The operator uses the ``start`` and ``end`` values from the transaction and finds all state updates the range overlaps with.

Once the operator finds all overlapping state updates, they **MUST** assert that the entire range described by the transaction is covered by existing state updates.  If this is not the case, the operator **MUST** return an `Invalid Transaction`_ error response. 

State Transition Execution
==========================
For each state update resolved in the previous step, the operator then **MUST** call the `executeStateTransition`_ method of the `plugin`_ that corresponds to the predicate address specified in the state update. This function call will return a new resulting state update. If any of these calls throw an error, the operator **MUST** return an `Invalid Transaction`_ error response.

The operator **MUST** then validate that all of the resulting state updates are identical. If any state update is not identical, the operator **MUST** return an `Invalid Transaction`_ error response.

Transaction Queueing
====================
Once the transaction has been verified, the operator can add the resulting state update to the `queue of state updates`_ to be published in the next block. If the queue already contains a state update on the range specified in the transaction, the operator **MUST** return a `Duplicate Transaction`_ error response.

*******************
Transaction Receipt
*******************
Finally, once the new state update has been added to the block queue, the operator **MUST** return a `transaction receipt`_ to the client.


.. References

.. _`correctly formatted`: ../01-core/state-system.html#id12
.. _`send transaction RPC method`: ../03-client/rpc-methods.html#pg-sendrawtransaction
.. _`Invalid Transaction Encoding`: ../03-client/rpc-error-messages.html#invalid-transaction-encoding
.. _`Invalid Transaction`: ../03-client/rpc-error-messages.html#invalid-transaction
.. _`Duplicate Transaction`: ../03-client/rpc-error-messages.html#duplicate-transaction
.. _`RPC server`: ../05-client-architecture/rpc-server.html
.. _`executeStateTransition`: ../05-client-architecture/predicate-plugin.html#executestatetransition
.. _`plugin`: ../05-client-architecture/predicate-plugin.html
.. _`operator's state manager`: ../06-operator-architecture/operator-state-manager.html
.. _`queue of state updates`: ../06-operator-architecture/block-manager.html
.. _`transaction receipt`: TODO
