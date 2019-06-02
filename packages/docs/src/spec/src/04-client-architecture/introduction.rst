############
Introduction
############

**********
Components
**********
Our client is broken up into several key components, each of which are specified separately. Here we'll discuss a high-level overview of the different components and what they do.

RpcServer
=========
`RpcServer`_ is the exposes a `JSON RPC`_ server that users can interact with. It pipes calls to different `RPC methods`_ to the various other components that can fulfill these requests.

RpcClient
=========
`RpcClient`_ handles interactions with other clients and with the operator.

StateDB
=======
`StateDB`_ stores information about the current `head state`_.

StateManager
============
`StateManager`_ executes transactions and applies them to the head state. ``StateManager`` also handles queries about the current state. ``StateManager`` is the only component with access to ``StateDB``.

HistoryDB
=========
`HistoryDB`_ stores historical information about the plasma chain. ``HistoryDB`` is primarily used to store `history proof`_ information necessary to assert the validity of a given transaction.

HistoryManager
==============
`HistoryManager`_ handles queries about historical state and generates `history proofs`_. ``HistoryManager`` is the only component with access to ``HistoryDB``.

PluginManager
=============
`PluginManager`_ handles access to the various `predicate plugins`_ loaded into the client. Other components are expected to go through ``PluginManager`` whenever they want to interact with a plugin.

EventWatcher
============
`EventWatcher`_ watches for various important events on Ethereum. Components can request that ``EventWatcher`` watch a specific event and will be notified whenever the event is fired. ``EventWatcher`` is designed to be robust as not to miss events or notify components of the same event multiple times.

ContractWrapper
===============
`ContractWrapper`_ is a simple wrapper around the smart contracts the client needs to interact with. All components, except for ``EventWatcher``, are expected to only interact with Ethereum through ``ContractWrapper``.

********************
Architecture Diagram
********************
We've provided a diagram of the interactions between the various client components below.

.. raw:: html

   <object type="image/svg+xml" data="../../_static/images/architecture/client-architecture.1.svg" style="max-width:100%" class="svg-hoverable">Client Architecture Diagram</object>

.. _`predicate plugins`: ./predicate-plugin.html
.. _`history proofs`:
.. _`history proof`: ./history-proof.html
.. _`head state`: TODO
.. _`RPC methods`: ./rpc-methods.html
.. _`JSON RPC`: https://www.jsonrpc.org/specification
.. _`ContractWrapper`: TODO
