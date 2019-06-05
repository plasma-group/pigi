#########
RpcServer
#########

***********
Description
***********
Each client **MUST** provide a `JSON RPC`_ server so that other clients can interact with it. ``RpcServer`` is a standard module that exposes a JSON RPC server over HTTP. A list of required `RPC methods`_ are specified separately.


-------------------------------------------------------------------------------

***
API
***

Methods
=======

serve
-----

.. code-block:: typescript

   async function serve(): Promise<void>

Description
^^^^^^^^^^^
Starts the server.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the server has started.

-------------------------------------------------------------------------------


close
-----

.. code-block:: typescript

   async function close(): Promise<void>

Description
^^^^^^^^^^^
Shuts down the server.

Returns
^^^^^^^
``Promise<void>``: Promise that resolves once the server has been shut down.


.. References

.. _`JSON RPC`: ../01-core/json-rpc.html
.. _`RPC methods`: ../03-client/rpc-methods.html
