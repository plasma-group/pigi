###########
RPC Methods
###########

********
JSON RPC
********
We require that the client and operator communicate via `JSON RPC`_. 

Data Structures
===============

JsonRpcRequest
--------------

.. code-block:: typescript

   interface JsonRpcRequest {
     jsonrpc: '2.0'
     method: string
     params?: any
     id: string | number
   }

JsonRpcSuccessResponse
----------------------

.. code-block:: typescript

   interface JsonRpcSuccessResponse {
     jsonrpc: '2.0'
     result: any
     id: string | number | null
   }

JsonRpcError
------------

.. code-block:: typescript

   interface JsonRpcError {
     code: number
     message: string
     data: any
   }

JsonRpcErrorResponse
--------------------

.. code-block:: typescript

   interface JsonRpcErrorResponse {
     jsonrpc: '2.0'
     error: JsonRpcError
     id: string | number
   }

*******
Methods
*******

pg_accounts
============

Description
-----------

Parameters
----------

Returns
-------

pg_blockNumber
==============

Description
-----------

Parameters
----------

Returns
-------

pg_sign
=======

Description
-----------

Parameters
----------

Returns
-------

pg_sendTransaction
==================

Description
-----------

Parameters
----------

Returns
-------

pg_sendRawTransaction
=====================

Description
-----------

Parameters
----------

Returns
-------

pg_call
=======

Description
-----------

Parameters
----------

Returns
-------

pg_getTransactionByHash
=======================

Description
-----------

Parameters
----------

Returns
-------


pg_getProof
===========

Description
-----------

Parameters
----------

Returns
-------

.. _`JSON RPC`: https://www.jsonrpc.org/specification

