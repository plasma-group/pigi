######################
Transaction Generation
######################

Clients must be able to create transactions that predicates use to compute state transitions. We now describe the process for generating a plasma transaction.

*************
Predicate API
*************
For the sake of backwards compatibility, we've chosen to define a standard **Predicate API** based on the `Ethereum contract ABI`_ specification. We're using calling this an "API" instead of an "ABI" since it doesn't really correspond to exactly what's happening under the hood, but instead acts as an interface that explains how the user can talk to the predicate.

This standard format provides a list of function descriptors that a client can use to interact with the predicate. Clients are able to easily generate transactions for predicates that provide a Predicate API.

Predicate API objects are an array of *API elements*. Each API element describes a single function, including the function's inputs and outputs. Certain elements of the Ethereum contract ABI specification have been removed for simplicity. Otherwise, the structure of a Predicate API element is identical to the structure of an Ethereum contract ABI element.

TypeScript interfaces for valid Predicate API objects are given below. Compare to the `Ethereum ABI JSON format`_ to understand similarities and differences. 

.. code-block:: typescript

   interface PredicateApiInput {
     name: string
     type: string
   }
   
   interface PredicateApiOutput {
     type: string
   }
   
   interface PredicateApiItem {
     name: string
     inputs: PredicateApiInput[]
     outputs: PredicateApiOutput[]
     constant: boolean
    }

Example: SimpleOwnership Predicate
==================================

We'll demonstrate Predicate API by looking at the `SimpleOwnership`_ predicate. SimpleOwnership allows one valid state transition whereby the current owner of a coin may sign off a new owner:

.. code-block:: solidity

   function send(address _newOwner) public

Note that this is *not* a ``constant`` method because it will update the state of the predicate.

SimpleOwnership also gives us a single getter method which returns the current owner:

.. code-block:: solidity

   function getOwner() public view returns (address)


This function *is* a ``constant`` method because it's only reading information, not writing it.

Putting these together, the API for this predicate is therefore:

.. code-block:: json

   [
       {
           name: "send",
           constant: false,
           inputs: [
               {
                   name: "newOwner",
                   type: "address"
               }
           ],
           outputs: []
       },
       {
           name: "getOwner",
           constant: true,
           inputs: [],
           outputs: [
               {
                   type: "address"
               }
           ]
       }
   ]

******************
Transaction Format
******************

Each predicate is different and could, in theory, define its own transaction format. However, clients need to know how to correctly generate a transaction for any given predicate. For simplicity, therefore, we've developed a standard transaction format.

A plasma transaction **must** contain all of the following components:

- ``plasmaContract`` - ``string``: The address of the specific `plasma deposit contract`_ which identifies the asset being transferred. This is somewhat equivalent to Ethereum's `chain ID`_ transaction parameter.
- ``block`` - ``number``: The block number in which this transaction will be included. We currently require that users sign off on the specific block in which their transaction will be included in order to prevent `certain attacks`_. 
- ``start`` - ``number``: Start of the `range`_ being transacted.
- ``end`` - ``number``: End of the range being transacted.
- ``methodId`` - ``string``: A unique method identifier that tells a given predicate what type of state transition a user is trying to execute. This is necessary because a predicate may define multiple ways in which a state object can be mutated. ``methodId`` **should** be computed as the `keccak256`_ hash of the method's signature, as given by the `Predicate API`_.
- ``parameters`` - ``string``: Input parameters to be sent to the predicate along with ``method`` to compute the state transiton. Must be `ABI encoded`_ according to the `Predicate API`_. This is similar to the transaction `input value encoding in Ethereum`_.
- ``witness`` - ``string``: Additional `ABI encoded`_ data used to authenticate the transaction. This will often be a single signature, but could theoretically be anything. Clients that interact with a predicate need to know in advance what the predicate requires as a witness.

The interface for a ``Transaction`` object in TypeScript is therefore as follows:

.. code-block:: typescript

   interface Transaction {
     predicateAddress: string
     block: number
     start: number
     end: number
     methodId: string
     parameters: string
     witness: string
   }

Transaction Encoding and Decoding
=================================

Plasma transactions **must** be `ABI encoded or decoded`_ according to the following schema:

.. code-block:: json

   {
       predicateAddress: address,
       block: uint256,
       start: uint256,
       end: uint256,
       methodId: bytes32,
       parameters: bytes,
       witness: bytes
   }

********************
Sending Transactions
********************

Transactions can be submitted to a node via the `sendTransaction RPC method`_. If the recipient node is not the operator, the node will forward the transaction to the operator. 

**********************************
Example: SimpleOwnership Predicate
**********************************

We're going to look at the whole process for generating a valid transaction to interact with some coins locked by the `SimpleOwnership`_ predicate. This example will explain how a client can use the `Predicate API`_ to generate all of the values necessary to generate a valid state-changing transaction that assigns the coins a new owner. Then we'll look at the process of encoding the transaction before it's sent to the operator.

First, let's pick some arbitary values for ``predicateAddress``, ``block``, ``start``, and ``end``. Users will know these values in advance, so we don't really need to explain the process of getting them in the first place. Let's say that the ``predicateAddress`` of the SimpleOwnership predicate is ``0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c`` and we want to send the range ``(0, 100)`` in plasma block ``123``.

Now we just need to figure out our values for ``methodId``, ``parameters``, and ``witness``. We're going to use the `Predicate API`_ for SimpleOwnership in order to generate these values. Users can get this API from a variety of places, but it's likely that most wallet software will come with a hard-coded API. Once we have the API, we know that ``send`` looks like this:

.. code-block:: json

   {
       name: "send",
       constant: false,
       inputs: [
           {
               name: "newOwner",
               type: "address"
           }
       ],
       outputs: []
   }

This is already enough information to generate ``methodId`` and ``parameters``. As we previously described, ``methodId`` is generated by taking the `keccak256`_ hash of the method's signature. In this case:

.. code-block:: typescript

   const methodId = keccak256('Send(bytes)')

Now let's generate ``parameters``. Our only parameter to ``send`` is ``newOwner``. We're going to send to a random address, ``0xd98165d91efb90ecef0ddf089ce06a06f6251372``. We need to `ABI encode`_ this address:

.. code-block:: typescript

   const newOwner = '0xd98165d91efb90ecef0ddf089ce06a06f6251372'
   const parameters = abi.encode(['address'], newOwner)

Next, we need to generate a valid witness for this transaction. SimpleOwnership requires a signature from the previous owner over the whole encoded transaction (of course, except for the witness itself) as a witness:

.. code-block:: typescript

   const unsignedTransaction = abi.encode([
     'address',
     'uint256',
     'uint256',
     'uint256',
     'bytes32',
     'bytes'
   ], [
     predicateAddress,
     block,
     start,
     end,
     methodId,
     parameters
   ])
   
   const privateKey = '0x...'
   const signature = sign(unsignedTransaction, privateKey)

Finally, we can combine everything to create the full transaction:

.. code-block:: typescript

   const witness = abi.encode(['bytes'], [signature])
   const signedTransaction = unsignedTransaction + witness

We now have a correctly formed transaction that can be sent to the operator for inclusion in block 123.


.. _`Ethereum contract ABI`: TODO
.. _`Ethereum ABI JSON format`: TODO
.. _`SimpleOwnership`: TODO
.. _`plasma deposit contract`: TODO
.. _`chain ID`: TODO
.. _`certain attacks`: TODO
.. _`range`: TODO
.. _`keccak256`: TODO
.. _`ABI encoded`:
.. _`ABI encode`:
.. _`ABI encoded or decoded`: TODO
.. _`input value encoding in Ethereum`: TODO
.. _`ABI encoded or decoded`: TODO
.. _`sendTransaction RPC method`: TODO
.. _`Predicate API`: TODO

