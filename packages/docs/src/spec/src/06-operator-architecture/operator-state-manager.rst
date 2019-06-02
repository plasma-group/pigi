####################
OperatorStateManager
####################

***********
Description
***********

.. todo::

   Add description for OperatorStateManager.

-------------------------------------------------------------------------------

***
API
***

Methods
=======

ingestTransaction
-----------------

.. code-block:: typescript

   async function ingestTransaction(
     transaction: Transaction
   ): Promise<string>

Description
^^^^^^^^^^^
Ingests an incoming transaction and enqueues it for inclusion in the next block.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: The `Transaction`_ to ingest.

Returns
^^^^^^^
``Promise<string>``: Receipt for the given transaction.


.. References

.. _`Transaction`: ../01-core/state-system.html#Transaction
