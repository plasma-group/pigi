#############
State Queries
#############

***************
Data Structures
***************

StateQuery
==========

.. code-block:: typescript

   interface StateQuery {
     plasmaContract: string
     predicateAddress: string
     start?: number
     end?: number
     method: string
     params: string[]
     filter: Expression
   }

Description
-----------
Represents a query for some information about the current state.

Fields
------
1. ``plasmaContract`` - ``string``: Address of the plasma contract to query. Clients may track multiple plasma contracts, so this parameter is necessary to resolve the correct data.
2. ``predicateAddress`` - ``string``: Address of the predicate to query.
3. ``start`` - ``number``: Start of the range to query. If not provided, will default to the 0.
4. ``end`` - ``number``: End of the range to query. If not provided, will default to the max range value.
5. ``method`` - ``string``: Name of the method to call.
6. ``params`` - ``string[]``: List of parameters to the call.
7. ``filter?`` - ``Expression``: An `Expression`_ to use to filter results. May be omitted to return all results.

StateQueryResult
================

.. code-block:: typescript

   interface StateQueryResult {
     stateUpdate: StateUpdate
     result: any
   }

Description
-----------
Result of sending a ``StateQuery`` object to a client.

Fields
------
1. ``stateUpdate`` - ``StateUpdate``: The ``StateUpdate`` object to which the result pertains.
2. ``result`` - ``string[]``: Result of the query on the state update.

****************
Query Generation
****************

Parsing Predicate ABI
=====================
The `Predicate ABI`_ provided by each predicate specifies a list of queries that can be made to a specific predicate. For example, the ABI of the `SimpleOwnership`_ predicatespecifies the following function:

.. code-block:: json

   {
     "name": "getOwner",
     "constant": true,
     "inputs": [],
     "outputs": [
       {
         "name": "owner",
         "type": "address"
       }
     ]
   }

Clients generate a ``StateQuery`` object by providing the ``name`` from the Predicate ABI and any necessary ``inputs``.

Sending Query Requests
======================
``StateQuery`` objects **do not** need to be encoded. Stqte queries can be sent to a client via the `state query RPC method`_.

Parsing Query Results
=====================
The result of a state query is a list of ``StateQueryResult`` objects. If a filter was provided as part of the ``StateQuery``, ``StateQueryResult`` objects will only be returned if the result passed the filter. 

The contents of the ``result`` field of each ``StateQueryResult`` depends on the ``output`` of the queried function in the Predicate ABI.

Example: SimpleOwnership
========================
We'll now provide an example state query for the ``getOwner`` method of the ``SimpleOwnership`` predicate. The Predicate ABI for ``SimpleOwnership`` describes this function as:

.. code-block:: json

   {
     "name": "getOwner",
     "constant": true,
     "inputs": [],
     "outputs": [
       {
         "name": "owner",
         "type": "address"
       }
     ]
   }


Let's assume that our ``plasmaContract`` is ``0x1b33c35be86be9d214f54af218c443c2623d3d0a`` and our ``SimpleOwnership`` predicate is located at ``0xf25746ac8621a7998e0992b9d88e260c117c145f``.

To query all state updates where ``0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c`` is the owner, we construct the following query:

.. code-block:: typescript

   const query: StateQuery = {
     plasmaContract: '0x1b33c35be86be9d214f54af218c443c2623d3d0a',
     predicateAddress: '0xf25746ac8621a7998e0992b9d88e260c117c145f',
     method: 'getOwner',
     params: [],
     filter: {
       $eq: [ '$owner', '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c' ]
     }
   }

Once we send this request via the `state query RPC method`_, we'll receive a result that looks like this:

.. code-block:: json

   [
     {
       stateUpdate: {
         block: 123,
         start: 0,
         end: 100,
         predicate: '0xf25746ac8621a7998e0992b9d88e260c117c145f',
         data: '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c'
       },
       result: ['0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c']
     },
     ...
   ]

We can then present this data in any way that we might want to.

**************
Query Handling
**************

Range Intersection
==================
Clients will receive a `StateQuery`_ object when receiving a state query. Clients first **MUST** use the range provided by the ``StateQuery`` to find all `state updates`_ in the current `head state`_ that match the provided ``predicateAddress``.

Passing Queries to Predicate Plugins
====================================
Once the client has found all relevant state updates, they **MUST** call the `queryState`_ method in the `predicate plugin`_ that corresponds to the provided ``predicateAddress``. ``queryState`` takes the ``method`` and ``parameters`` from the ``StateQuery`` and returns an array of results.

If a ``filter`` was given in the ``StateQuery``, then the client **MUST** filter these results. More information about handling filters is explained in the section about `Expressions`_.

Any results that have not been removed by the filter are then returned.

