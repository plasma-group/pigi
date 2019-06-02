#############
State Queries
#############

Clients need to be able to query the local state to build effective front-ends. For example, a wallet might be interested in querying all state objects that a specific user owns. We've designed a querying system to make this process as easy as possible.

****************
Query Generation
****************

Parsing Predicate API
=====================
The `Predicate API`_ provided by each predicate specifies a list of queries that can be made on state objects locked with that predicate. For example, the API of the `SimpleOwnership`_ predicate specifies the following function:

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

Users first need to parse this API to figure out what methods are available for the predicate they're attempting to query. Once the user has determined the name and required parameters for the method they want to query, they can generate a `StateQuery`_. The user can then send this query to a client via the `state query RPC method`_.

Parsing Query Results
=====================
The result of a state query is a list of `StateQueryResult`_ objects. If a filter was provided as part of the ``StateQuery``, only ``StateQueryResult`` objects that passed the provided filter will be returned.

Example: SimpleOwnership
========================
We'll now provide an example state query for the ``getOwner`` method of the ``SimpleOwnership`` predicate. The Predicate API for ``SimpleOwnership`` describes ``getOwner`` as:

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
       $eq: [ '$0', '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c' ]
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
Users filter their results by providing an `Expression`_ that performs some operation on the provided result. If a ``filter`` was given in the ``StateQuery``, then the client **MUST** correctly remove results according to the filter. More information about filters is given in the page about `Expressions`_.

Users can filter based on the outputs of the query method by inserting strings in the form of ``\$[0-9]+`` (starting at ``$0``).

For example, a user could filter results where the first output is greater than ``0`` and the second result is less than ``100`` like this:

.. code-block:: typescript

   {
     $and: [
       { $gt: [ '$0', 0 ] },
       { $lt: [ '$1', 100 ] }
     ]
   }

Any results that have not been removed by the filter can then be returned to the requesting client.


.. _`Predicate API`: TODO
.. _`SimpleOwnership`: TODO
.. _`state query RPC method`: TODO
.. _`StateQuery`: TODO
.. _`StateQueryResult``: TODO
.. _`state updates`: TODO
.. _`head state`: TODO
.. _`queryState`: TODO
.. _`predicate plugin`: TODO
.. _`Expressions`: TODO
.. _`Expression`: TODO
