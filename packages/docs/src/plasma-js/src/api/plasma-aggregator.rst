==============
PlasmaAggregator
==============

``PlasmaAggregator`` handles interaction with the plasma aggregator.

.. code-block:: javascript

    const PlasmaAggregator = require('@pigi/plasma-js').PlasmaAggregator

    // Can replace the endpoint with the endpoint of your aggregator.
    const aggregator = new PlasmaAggregator('http://localhost:3000')

------------------------------------------------------------------------------

getBlockMetadata
================

.. code-block:: javascript

    aggregator.getBlockMetadata(start, end)

Returns metadata about a list of blocks.

----------
Parameters
----------

1. ``start`` - ``number``: First block to query.
2. ``end`` - ``number``: Last block to query.

-------
Returns
-------

``Promise<Array>``: A list of metadata objects for each block.

-------
Example
-------

.. code-block:: javascript

    const blocks = await aggregator.getBlockMetadata(0, 3)
    console.log(blocks)
    > [ { blockNumber: '00000001',
          rootHash: '0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: '0168c59834e8',
          numTxs: '00' },
        { blockNumber: '00000002',
          rootHash: '0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: '0168c5983bbe',
          numTxs: '00' },
        { blockNumber: '00000003',
          rootHash: '0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: '0168c5983fcf',
          numTxs: '00' } ]

------------------------------------------------------------------------------

getBlockTransactions
====================

.. code-block:: javascript

    aggregator.getBlockTransactions(block, start, end)

Returns the transactions in a specific block.
Queries all transactions between ``start`` and ``end``.
Limited to 25 transactions at a time.

----------
Parameters
----------

1. ``block`` - ``number``: Number of the block to query.
2. ``start`` - ``number``: First transaction to query.
3. ``end`` - ``number``: Last transaction to query.

-------
Returns
-------

``Promise<Array>``: A list of transaction objects.

------------------------------------------------------------------------------

getTransaction
==============

.. code-block:: javascript

    aggregator.getTransaction(hash)

Returns a transaction by its hash.

----------
Parameters
----------

1. ``hash`` - ``string``: Hash of the transaction to return.

-------
Returns
-------

``Promise<SignedTransaction>``: The transaction object.

-------
Example
-------

.. code-block:: javascript

    const transaction = await aggregator.getTransaction('0x7b6ced8ecd267f504f86b6cace13f078f936a20adc98b37fc83e1030f976e8e5')
    console.log(transaction)
    > SignedTransaction {
        schema:
          Schema {
            unparsedFields:
              { block: [Object], transfers: [Object], signatures: [Object] },
                fields:
                { block: [SchemaNumber],
                  transfers: [Schema],
                  signatures: [Schema] } },
        block: <BN: 2>,
        transfers:
          [ { sender: '0x82A978B3f5962A5b0957d9ee9eEf472EE55B42F1',
              recipient: '0x7d577a597B2742b498Cb5Cf0C26cDCD726d39E6e',
              token: <BN: 0>,
              start: <BN: 0>,
              end: <BN: a> } ],
        signatures: [] }

------------------------------------------------------------------------------

getRecentTransactions
=====================

.. code-block:: javascript

    aggregator.getRecentTransactions(start, end)

Returns a list of recent transactions.

----------
Parameters
----------

1. ``start`` - ``number``: First transaction to query.
2. ``end`` - ``number``: Last transaction to query.

-------
Returns
-------

``Promise<Array>``: A list of transaction objects.

-------
Example
-------

.. code-block:: javascript

    const transactions = await aggregator.getRecentTransactions(0, 10)
    console.log(transactions)
    > [ SignedTransaction {
          schema: Schema { unparsedFields: [Object], fields: [Object] },
          block: <BN: 5>,
          transfers: [ [Object] ],
          signatures: [ [Object] ] },
        SignedTransaction {
          schema: Schema { unparsedFields: [Object], fields: [Object] },
          block: <BN: 5>,
          transfers: [ [Object] ],
          signatures: [ [Object] ] },
        SignedTransaction {
          schema: Schema { unparsedFields: [Object], fields: [Object] },
          block: <BN: 2>,
          transfers: [ [Object] ],
          signatures: [ [Object] ] } ]

------------------------------------------------------------------------------

getCurrentBlock
===============

.. code-block:: javascript

    aggregator.getCurrentBlock()

Returns the current block number according to the aggregator.

-------
Returns
-------

``Promise<number>``: Current block number.

-------
Example
-------

.. code-block:: javascript

    const currentBlock = await aggregator.getCurrentBlock()
    console.log(currentBlock)
    > 6

------------------------------------------------------------------------------

submitBlock
===========

.. code-block:: javascript

    aggregator.submitBlock()

Attempts to force the aggregator to submit a block.
If the aggregator is properly configured, it won't let you do this.
Usually used for testing locally.

-------
Example
-------

.. code-block:: javascript

    const submittedBlock = await aggregator.submitBlock()
    console.log(submittedBlock)
    > 7
