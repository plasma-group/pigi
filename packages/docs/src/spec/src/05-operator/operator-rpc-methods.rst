####################
Operator RPC Methods
####################

***********
Description
***********

.. todo::

   Add description for Operator RPC methods.

-------------------------------------------------------------------------------


*******
Methods
*******

pgop_sendTransaction
====================

Description
^^^^^^^^^^^
Sends a transaction to be `ingested`_ by the operator.

Parameters
^^^^^^^^^^
1. ``transaction`` - ``Transaction``: The `Transaction`_ to be ingested.

Returns
^^^^^^^
``string``: The `transaction receipt`_ for the given transaction.


.. References

.. _`ingested`: ./transaction-ingestion.html
.. _`Transaction`: ../01-core/state-system.html#Transaction
.. _`transaction receipt`: TODO
