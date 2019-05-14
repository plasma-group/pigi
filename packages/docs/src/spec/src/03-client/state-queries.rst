#############
State Queries
#############

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
       $eq: [ '$1', '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c' ]
     }
   }

Our filter here specifies that the first output of the function call (which we know to be the owner in this case) should be equal to a given address. Results where this is not the case will not be returned.

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

Filtering Queries
=================
If a ``filter`` was given in the ``StateQuery``, then the client **MUST** filter these results. More information about the type of available filters is explained in the section about `Expressions`_. Clients will provide strings in the form of ``"$x"`` to identify the index of the output they wish to use as part of their filter.

An example filter may look as follows:

.. code-block:: typescript

   {
     $and: [
       { $gt: [ '$1', 0 ] },
       { $lt: [ '$2', 100 ] }
     ]
   }

Such a filter is stating that the first output result of the query must be greater than 0 and the second output must be less than 100.

Any results that have not been removed by the filter can then be returned to the requesting client.

