########################
Generalized State System
########################

The concept of state and state transitions is relatively universal. However, Layer 2 systems are unusual because they often require that state transitions be efficiently representable on the Layer 1 platform. As a result, existing models of state transitions on plasma are usually quite restrictive.

In order to develop a plasma system that could allow for more general state transitions, we found it important to develop a new system for representing state and state transitions. Our system was particularly designed to make state transitions easily executable on Ethereum.

This page describes our state model and the various terms we use in the rest of this specification. It's important to understand this model in detail before continuing.

*************
State Objects
*************

State Object Model
==================
The core building block of our model is the "state object". Each state object represents a particular piece of state within the system and is composed of:

1. A globally unique identifier.
2. The address of a `predicate contract`_.
3. Some arbitrary data.

The TypeScript interface for the state object is:

.. code-block:: typescript

   interface StateObject {
     id: string
     predicate: string
     data: string
   }

State objects are unique objects (hence the ``id``) that may be **created**, **destroyed**, or **mutated**. The conditions under which a state object may undergo one of these changes, as well as the effects of such a change, are defined in a `predicate`_. Each state object specifies a prediciate identifier (``predicate``) that points to the specific predicate that controls ("locks") the state object. 

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
State objects **MUST** be `ABI encoded and decoded`_ according to the following structure:

.. code-block:: json

   [
       id: bytes,
       predicate: address,
       data: bytes
   ]

Rationale
---------
Plasma Group has decided to write its contracts in `Solidity`_ instead of in `Vyper`_. We therefore needed an encoding scheme that would be easy to decode within a Solidity contract. Other teams have invested significant resources into developing smart contract libraries for encoding schemes. However, Solidity provides `native support for ABI encoding and decoding`_. In order to minimize effort spent on encoding libraries, we've decided to simply use the native ABI encoding mechanisms.

Test Vectors
------------

.. todo::

   Add test vectors for encoding and decoding.

**********
Predicates
**********
Predicates are functions that define the ways in which state objects can be mutated. We require that the ``id`` of a specific state object never change (since it would then be a different state object). However, the ``predicate`` and ``data`` can be changed arbitrarily according to the rules defined in the predicate.

Predicate Methods
=================
Predicates can provide one or more methods which take a state object in one state and transform it into another state. For example, a simple "ownership" predicate may define a function that allows the current owner of the object (defined in ``object.data``) to specify a new owner.

For simplicity, we require that predicate methods may only allow input and output types that correspond to the `primitive types in Solidity`_.

Rationale
---------
Effectively all blockchain systems provide a model for different "methods" that determine how a given object can be transformed. Bitcoin's UTXO model allows for multiple "spending conditions" under which a UTXO can be consumed. Ethereum's account model allows a contract to specify multiple explicit state-transforming functions. The "method" model generalizes this concept.

We require that methods only use the primitive types available in Solidity so that predicates can easily be executed by treating them as Solidity contracts. Defining new types not understood by Solidity would require the development of a completely new EVM language.

Requirements
------------
- Predicate methods:
   - **MUST** be executable within a single transaction to an Ethereum smart contract. 
   - **MUST** only use the `primitive types in Solidity`_.

Method Identifiers
==================
Methods within each predicate are given a unique identifier computed as the `keccak256`_ hash of the UTF-8 encoded version of the method's signature.

For any given method:

.. code-block:: solidity

   function methodName(Param1Type param1, Param2Type param2) public returns (ReturnType)

We get a corresponding signature:

.. code-block:: none
   
   methodName(Param1Type, Param2Type, ...)

Example
-------
We'll use the `SimpleOwnership`_ predicate as an example. State objects locked with the ``SimpleOwnership`` have an "owner" field stored in ``object.data``. ``SimpleOwnership`` defines a method that allows the current "owner" of a state object to specify a new owner:

.. code-block:: solidity

   function send(address _newOwner) public

The signature of this method is:

.. code-block:: solidity

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

.. code-block:: solidity

   function send(address _newOwner) public

Note that this is **not** a ``constant`` method because it will update the state of the predicate.

``SimpleOwnership`` also provides a method which returns  the current owner:

.. code-block:: solidity

   funtion getOwner() public view returns (address)

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

.. _`Transaction`:

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

A Solidity struct:

.. code-block:: solidity

   struct Transaction {
       bytes objectId;
       bytes32 methodId;
       bytes parameters;
       bytes witness;
   }

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
Similarly, transactions **MUST** be `ABI encoded and decoded`_ in the form:

.. code-block:: json
   
   [ objectId: bytes,  methodId: bytes, parameters: bytes, witness: bytes ]``

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

.. _`StateUpdate`:

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


.. References

.. _`computed`: #method-identifiers
.. _`predicate`: #predicates
.. _`predicate contract`: ../02-contracts/predicate-contract.html
.. _`SimpleOwnership`: ../07-predicates/simple-ownership.html
.. _`RLP encoded`: https://github.com/ethereum/wiki/wiki/RLP
.. _`abi encoding`: https://solidity.readthedocs.io/en/v0.5.8/abi-spec.html
.. _`rlp encoding`: https://github.com/ethereum/wiki/wiki/RLP
.. _`rlp decoded`: https://github.com/ethereum/wiki/wiki/RLP#rlp-decoding
.. _`Solidity`: https://solidity.readthedocs.io/en/v0.5.8/
.. _`native support for ABI decoding`: https://solidity.readthedocs.io/en/v0.5.8/units-and-global-variables.html?highlight=abi.encode#abi-encoding-and-decoding-functions
.. _`native support for RLP decoding`: https://vyper.readthedocs.io/en/v0.1.0-beta.8/built-in-functions.html#rlplist
.. _`audited RLP decoding libraries`: https://github.com/hamdiallam/Solidity-RLP
.. _`primitive types in Solidity`: https://solidity.readthedocs.io/en/latest/types.html
.. _`keccak256`: https://ethereum.stackexchange.com/questions/550/which-cryptographic-hash-function-does-ethereum-use
.. _`Ethereum contract ABI`: 
.. _`Ethereum ABI JSON format`: https://solidity.readthedocs.io/en/latest/abi-spec.html
.. _`ABI encoded and decoded`: https://solidity.readthedocs.io/en/latest/abi-spec.html
.. _`Vyper`: https://github.com/ethereum/vyper
.. _`native support for ABI encoding and decoding`: https://solidity.readthedocs.io/en/latest/units-and-global-variables.html#abi-encoding-and-decoding-functions
