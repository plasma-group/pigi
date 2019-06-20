===============
AggregatorService
===============

``AggregatorService`` handles all interaction with the aggregator_.
This includes things like sending transactions and pulling any pending transactions.

------------------------------------------------------------------------------

getNextBlock
============

.. code-block:: javascript

    aggregator.getNextBlock()

Returns the next block that will be submitted.

-------
Returns
-------

``Promise<number>``: Next block number.

------------------------------------------------------------------------------

getEthInfo
==========

.. code-block:: javascript

    aggregator.getEthInfo()

Returns information about the smart contract.

-------
Returns
-------

``Promise<Object>``: Smart contract info.

------------------------------------------------------------------------------

getTransactions
===============

.. code-block:: javascript

    aggregator.getTransactions(address, startBlock, endBlock)

Returns a list of transactions received by an address between two blocks.

----------
Parameters
----------

1. ``address`` - ``string``: Address to query.
2. ``startBlock`` - ``number``: Block to query from.
3. ``endBlock`` - ``number``: Block to query to.

-------
Returns
-------

``Promise<Array>``: List of encoded transactions.

------------------------------------------------------------------------------

getTransaction
==============

.. code-block:: javascript

    aggregator.getTransaction(encoded)

Returns a transaction proof for a given transaction.

----------
Parameters
----------

1. ``encoded`` - ``string``: The encoded transaction.

-------
Returns
-------

``Promise<Object>``: Proof information for the transaction.

------------------------------------------------------------------------------

sendTransaction
===============

.. code-block:: javascript

    aggregator.sendTransaction(transaction)

Sends a SignedTransaction_ to the aggregator.

----------
Parameters
----------

1. ``transaction`` - ``string``: The encoded SignedTransaction_.

-------
Returns
-------

``Promise<string>``: The transaction receipt.

------------------------------------------------------------------------------

submitBlock
===========

.. code-block:: javascript

    aggregator.submitBlock()

Attempts to have the aggregator submit a new block.
Won't work if the aggregator is properly configured, but used for testing.


.. _aggregator: specs/aggregator.html
.. _transaction relay: TODO
.. _Transaction: specs/transactions.html#transaction-object
