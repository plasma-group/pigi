########
JSON RPC
########

***********
Description
***********
We require that the clients via `JSON RPC`_. A list of available `RPC methods`_ are specified separately.

We chose JSON RPC because the protocol is relatively simple and because it interacts well with `TypeScript`_. `Ethereum also uses JSON RPC`_ for its client communication. The structure of our RPC methods are based heavily on the structure of Ethereum's RPC methods to reduce cognitive overhead for client developers.

-------------------------------------------------------------------------------


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
Represents a `JSON RPC request`_.

Fields
------
1. ``jsonrpc`` - ``string``: **MUST** be exactly '2.0'.
2. ``method`` - ``string``: Name of the method to call.
3. ``params?`` - ``any``: Formatted request parameter object.
4. ``id`` - ``string | number``: Request identifier.

-------------------------------------------------------------------------------


JsonRpcSuccessResponse
======================

.. code-block:: typescript

   interface JsonRpcSuccessResponse {
     jsonrpc: '2.0'
     result: any
     id: string | number
   }

Description
-----------
Represents a successful `JSON RPC response`_.

Fields
------
1. ``jsonrpc`` - ``string``: **MUST** be exactly '2.0'.
2. ``result`` - ``any``: Formatted response to the request.
3. ``id`` - ``string | number``: Same identifier as the one given during the request.

-------------------------------------------------------------------------------


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
Represents information about a `JSON RPC error`_.

Fields
------
1. ``code`` - ``number``: Error code ID.
2. ``message`` - ``string``: Additional short error message.
3. ``data`` - ``any``: Additional error information.

-------------------------------------------------------------------------------


JsonRpcErrorResponse
====================

.. code-block:: typescript

   interface JsonRpcErrorResponse {
     jsonrpc: '2.0'
     error: JsonRpcError
   }

Description
-----------
Represents a `JSON RPC error response`_ to request.

Fields
------
1. ``jsonrpc`` - ``string``: **MUST** be exactly '2.0'.
2. ``error`` - ``JsonRpcError``: RPC error object.

-------------------------------------------------------------------------------


JsonRpcResponse
===============

.. code-block:: typescript

   type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

Description
-----------
Either a success response or an error response.


.. _`JSON RPC`: https://www.jsonrpc.org/specification
.. _`RPC methods`: TODO
.. _`TypeScript`: https://www.typescriptlang.org/
.. _`Ethereum also uses JSON RPC`: https://github.com/ethereum/wiki/wiki/JSON-RPC
.. _`JSON RPC request`: https://www.jsonrpc.org/specification#request_object
.. _`JSON RPC error response`:
.. _`JSON RPC response`: https://www.jsonrpc.org/specification#response_object
.. _`JSON RPC error`: https://www.jsonrpc.org/specification#error_object
