#########
RpcClient
#########

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

.. _`JSON RPC request`: TODO
.. _`JSON RPC response`: TODO

