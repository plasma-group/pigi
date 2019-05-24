########################
Generalized State System
########################

*************
State Objects
*************

State Object Model
==================
State within our model is represented as a set of "state objects". Each state object is composed of:

1. A globally unique identifier.
2. The address of a `predicate contract`_.
3. Some arbitrary data.

The TypeScript interface for the state object is:

.. code-block:: typescript

   interface StateObject {
     id: string,
     address: string,
     data: string
   }

The Vyper struct for a state object is:

.. code-block:: python

   struct StateObject:
       id: bytes
       address: address
       data: bytes

State objects may be **created**, **destroyed**, or **mutated**. The conditions under which a state object may undergo one of these changes, as well as the effects of such a change, are defined by the `predicate contract`_ located at the address specified in the object.

Requirements
------------

- State objects:
   - **MUST** have a globally unique identifier.
   - **MUST** specify the 20-byte address of a predicate contract.
   - **MUST** specify some additional arbitrary stored data.
      - **MAY** specify the empty string in place of arbitrary stored data.
      - **SHOULD** specify the zero address to represent a "burned" state.

Rationale
---------
We wanted our generalized plasma construction to be agnostic to the underlying design (Plasma MVP, Plasma Cash, etc.). As a result, it became important to find a very general-purpose way of representing state.

The idea of a "state object", an object that can be created, destroyed, or modified, seemed simple and intuitive. Perhaps more importantly, the "state object" model encapsulates both UTXOs and accounts. Ephemeral UTXO-like systems can be represented by objects which can only be created or destroyed, but not modified. Account-like systems can be represented by objects which can be modified.

The state object therefore allows us to simultaneously represent systems like Plasma MVP *and* Plasma Cash with a single unified notation. We believe this unification will lead to increased collaboration and decreased duplication of work.

Encoding and Decoding
=====================
State objects **MUST** be `RLP encoded`_ in the form ``[id, address, data]``.

In TypeScript:

.. code-block:: typescript

   import rlp from 'rlp'
   
   const id = 123456789
   const address = '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c'
   const data = 'some data'
   
   const encoded = rlp.encode([id, address, data])


Similarly, state objects **MUST** be `RLP decoded`_ as ``[id, address, data]``.

In TypeScript:

.. code-block:: typescript

   import rlp from 'rlp'
   
   const encoded = '0x.....'
   const [id, address, data] = rlp.decode(encoded)

Rationale
---------
We needed a standard encoding scheme for state objects that would be portable between `Solidity`_ and `Vyper`_. However, due to the complexity of general-purpose encoding schemes, we wanted to use something that was either already audited or provided as native functionality. This effectively left us with a choice between `ABI encoding`_ and `RLP encoding`_.

Solidity provides `native support for ABI decoding`_ but not for RLP encoding. Vyper provides `native support for RLP decoding`_, but not for ABI encoding. Most of the Plasma Group contract code has been written in Vyper. We are also aware of `audited RLP decoding libraries`_ for Solidity. Therefore, we've decided to use RLP for overall simplicity.

Test Vectors
------------

.. todo::

   Add test vectors for encoding and decoding.

**********
Predicates
**********
Predicates are functions that define the ways in which state objects can be mutated.

Predicate Methods
=================
Predicates can provide one or more methods which take a state object in one state and transform it into another state. For example, a simple "ownership" predicate may define a function that allows the current owner of the object (defined in ``object.data``) to specify a new owner.

For simplicity, we require that predicate methods may only allow input and output types that correspond to the `primitive types in Solidity`_.

Rationale
---------
Effectively all blockchain systems provide a model for different "methods" that determine how a given object can be transformed. Bitcoin's UTXO model allows for multiple "spending conditions" under which a UTXO can be consumed. Ethereum's account model allows a contract to specify multiple explicit state-transforming functions. The "method" model generalizes this concept.

We require that methods only use the primitive types avialable in Solidity so that predicates can easily be executed by treating them as Solidity contracts. Defining new types not understood by Solidity would require the development of a completely new EVM language.

Requirements
------------
- Predicate methods:
   - **MUST** be executable within a single transaction to an Ethereum smart contract. 
   - **MUST** only use the `primitive types in Solidity`_.

Method Identifiers
==================
Methods within each predicate are given a unique identifier computed as the `keccak256`_ hash of the UTF-8 encoded version of the method's signature.

For any given method:

.. code-block:: python
   
   def method_name(arg1: arg1_type, arg2: arg2_type, ...) -> return_type

.. code-block::
   
   method_name(arg1_type, arg2_type, ...)

Example
-------
We'll use the `SimpleOwnership`_ predicate as an example. State objects locked with the ``SimpleOwnership`` have an "owner" field stored in ``object.data``. ``SimpleOwnership`` defines a method that allows the current "owner" of a state object to specify a new owner:

.. code-block:: python

   @public
   def send(newOwner: address):

The signature of this method is:

.. code-block:: python

   send(address)

In TypeScript we can compute the method ID as:

.. code-block:: typescript

   import { keccak256 } from 'js-sha3'
   
   const methodId = keccak256('send(address)')

Rationale
---------
We decided on this scheme for computing method signatures for several reasons.

Other languages, like Solidity and Vyper, define the method ID as the first four bytes of the `keccak256`_ hash. One benefit of the 4-byte scheme is that it reduces the total amount of data on-chain. Unfortunately, this requires checking for any hash collisions between function names. For simplicity, therefore, we decided to use the *full* 32 byte hash. The additional required 28 bytes do not seem like a significant enough waste of gas to justify more complex collision-detection logic for predicates.

We also chose this system because ``keccak256`` hashes are cheaply computable on Ethereum. 

Requirements
------------
- Method ID:
   - **MUST** be computed as the `keccak256`_ hash of the method signature.

Test Vectors
------------

.. todo::
   
   Add test vectors for method identifiers.

Predicate API
=============
Predicates **MUST** provide a **Predicate API** that allows a client to interact with the predicate. A Predicate API is composed of an array of **API elements**. each API element describes a single function, including the function's inputs and outputs. The structure of the API element has been based off of the `Ethereum contract ABI`_ specification.

TypeScript interfaces for valid Predicate API objects are provided below. Compare to the `Ethereum ABI JSON format`_ to understand similarities and differences.

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

Example
-------
We're going to describe a valid Predicate API by looking at the `SimpleOwnership`_ predicate. ``SimpleOwnership`` allows one valid state transition whereby the current owner of a state object may sign off on a new owner:

.. code-block:: python

   @public
   def send(newOwner: address):

Note that this is **not** a ``constant`` method because it will update the state of the predicate.

``SimpleOwnership`` also provides a method which returns  the current owner:

.. code-block:: python

   @constant
   def getOwner() -> address:

This function **is** a ``constant`` method because it only reads information and does not change the state of the object.

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

Rationale
---------

.. todo::

   Add rationale for Predicate API.

Requirements
------------

.. todo::

   Add requirements for Predicate API.

************
Transactions
************

Transaction Model
=================
Mutations to state objects are carried out by **transactions**. Transactions specify:

1. The ID of a state object to mutate.
2. The ID of a method to call in the state object's predicate.
3. Parameters to be passed to the object's predicate.
4. Additional witness data to be used to authenticate the transaction.

A TypeScript interface for a transaction:

.. code-block:: typescript

   interface Transaction {
     objectId: string
     methodId: string
     parameters: string
     witness: string
   }

A Vyper struct:

.. code-block:: python

   struct Transaction:
       objectId: bytes
       methodId: bytes32
       parameters: bytes
       witness: bytes

``methodId`` corresponds to the identifier `computed`_ from the `Predicate API`_ of the referenced object's predicate contract.

Rationale
---------

.. todo::

   Add rationale for transaction model.

Requirements
------------

.. todo::

   Add requirements for transaction model.

Encoding and Decoding
=====================
Transactions **MUST** be `RLP encoded`_ in the form ``[objectId, methodId, parameters, witness]``.

In TypeScript:

.. code-block:: typescript

   import rlp from 'rlp'
   
   const objectId = 123456789
   const methodId = '0x....'
   const parameters = '0x....'
   const witness = '0x....'
   
   const encoded = rlp.encode([objectId, methodId, parameters, witness])

Similarly, transactions **MUST** be `RLP decoded`_ in the form ``[objectId, methodId, parameters, witness]``.

In TypeScript:

.. code-block:: typescript

   import rlp from 'rlp'
   
   const encoded = '0x....'
   const [objectId, methodId, parameters, witness] = rlp.decode(encoded)

Rationale
---------

.. todo::

   Add rationale for transaction encoding and decoding.

Requirements
------------

.. todo::

   Add requirements for transaction encoding and decoding.

Test Vectors
------------

.. todo::

   Add test vectors for transaction encoding and decoding.

Transaction Hash
================

Test Vectors
------------

.. todo::

   Add test vectors for the transaction hash.

*************
State Updates
*************

.. todo::

   Explain state updates at a high level.

State Update Model
==================

.. todo::

   Specify the model for a state update.

Encoding and Decoding
=====================

.. todo::

   Specify how to encode and decode state updates.

Rationale
---------

.. todo::

   Add rationale for state update model.

Requirements
------------

.. todo::

   Add requirements for state update model.

State Update Hash
=================

.. todo::

   Explain how to compute state update hash.

Test Vectors
------------

.. todo::
   
   Add test vectors for computing state update hash.

.. _`computed`: TODO
.. _`RLP encoded`: https://github.com/ethereum/wiki/wiki/RLP
.. _`predicate contract`: TODO
.. _`abi encoding`: https://solidity.readthedocs.io/en/v0.5.8/abi-spec.html
.. _`rlp encoding`: https://github.com/ethereum/wiki/wiki/RLP
.. _`rlp decoded`: https://github.com/ethereum/wiki/wiki/RLP#rlp-decoding
.. _`Solidity`: https://solidity.readthedocs.io/en/v0.5.8/
.. _`Vyper`: https://vyper.readthedocs.io/en/v0.1.0-beta.8/
.. _`native support for ABI decoding`: https://solidity.readthedocs.io/en/v0.5.8/units-and-global-variables.html?highlight=abi.encode#abi-encoding-and-decoding-functions
.. _`native support for RLP decoding`: https://vyper.readthedocs.io/en/v0.1.0-beta.8/built-in-functions.html#rlplist
.. _`audited RLP decoding libraries`: https://github.com/hamdiallam/Solidity-RLP
.. _`Predicate API`: TODO
.. _`primitive types in Solidity`: TODO
.. _`keccak256`: TODO
.. _`SimpleOwnership`: TODO
.. _`Ethereum contract ABI`: TODO
.. _`Ethereum ABI JSON format`: TODO

