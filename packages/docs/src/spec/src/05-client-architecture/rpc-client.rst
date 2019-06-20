#########
RpcClient
#########

***********
Description
***********
``RpcClient`` is simple client wrapper for any `JSON RPC`_ server. ``RpcClient`` can be used to make requests to the aggregator or to any other client. A list of available `RPC methods`_ are specified separately.


-------------------------------------------------------------------------------

***
API
***

Methods
=======

send
----

.. code-block:: typescript

   async function send(request: JsonRpcRequest): Promise<JsonRpcResponse>

Description
^^^^^^^^^^^
Sends a `JSON RPC request`_ to the client's specified server and returns the corresponding `JSON RPC response`_.

Parameters
^^^^^^^^^^
1. ``request`` - ``JsonRpcRequest``: A `JSON RPC request`_ object to send to the server.

Returns
^^^^^^^
``JsonRpcResponse``: A `JSON RPC response`_ object sent back by the server.


.. References

.. _`RPC methods`: ./rpc-methods
.. _`JSON RPC`: ../01-core/json-rpc.html
.. _`JSON RPC request`: ../01-core/json-rpc.html#jsonrpcrequest
.. _`JSON RPC response`: ../01-core/json-rpc.html#jsonrpcresponse
