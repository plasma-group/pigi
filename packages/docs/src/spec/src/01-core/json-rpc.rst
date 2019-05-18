########
JSON RPC
########

***********
Description
***********
We require that the clients via `JSON RPC`_. A list of available `RPC methods`_ are specified separately.

We chose JSON RPC because the protocol is relatively simple and because it interacts well with `TypeScript`_. `Ethereum also uses JSON RPC`_ for its client communication. The structure of our RPC methods are based heavily on the structure of Ethereum's RPC methods to reduce cognitive overhead for client developers.

***************
Data Structures
***************

JsonRpcRequest
==============

.. code-block:: typescript

   interface JsonRpcRequest {
     jsonrpc: '2.0'
     method: string
     params?: any
     id: string | number
   }

Description
-----------

Fields
------

JsonRpcSuccessResponse
======================

.. code-block:: typescript

   interface JsonRpcSuccessResponse {
     jsonrpc: '2.0'
     result: any
     id: string | number | null
   }

Description
-----------

Fields
------

JsonRpcError
============

.. code-block:: typescript

   interface JsonRpcError {
     code: number
     message: string
     data: any
   }

Description
-----------

Fields
------

JsonRpcErrorResponse
====================

.. code-block:: typescript

   interface JsonRpcErrorResponse {
     jsonrpc: '2.0'
     error: JsonRpcError
   }

Description
-----------

Fields
------

JsonRpcResponse
===============

.. code-block:: typescript

   type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

Description
-----------

.. _`JSON RPC`: https://www.jsonrpc.org/specification
.. _`RPC methods`: TODO
.. _`TypeScript`: https://www.typescriptlang.org/
.. _`Ethereum also uses JSON RPC`: https://github.com/ethereum/wiki/wiki/JSON-RPC

