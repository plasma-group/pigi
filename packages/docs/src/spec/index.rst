=============================================
Plasma Group Generalized Plasma Specification
=============================================
`Plasma Group`_ is working on a `generalized plasma`_ construction that supports significantly more functionality than alternative plasma chains.
Generalized plasma chains are complex objects of study.
This website documents the entirety of the Plasma Group design, from the inner workings of the client to the specifics of the plasma smart contract.

.. toctree::
   :maxdepth: 1
   :caption: #00: Introduction

   src/00-introduction/introduction
   src/00-introduction/glossary
   src/00-introduction/contributors

.. toctree::
   :maxdepth: 1
   :caption: #01: Core Design Components

   src/01-core/state-system
   src/01-core/state-object-ranges
   src/01-core/merkle-interval-tree
   src/01-core/double-layer-tree
   src/01-core/json-rpc

.. toctree::
   :maxdepth: 1
   :caption: #02: Contract Specification

   src/02-contracts/deposit-contract
   src/02-contracts/commitment-contract
   src/02-contracts/predicate-contract
   src/02-contracts/transaction-based-predicate
   src/02-contracts/limbo-exit-predicate

.. toctree::
   :maxdepth: 1
   :caption: #03: Client Specification

   src/03-client/introduction
   src/03-client/deposit-generation
   src/03-client/event-handling
   src/03-client/transaction-generation
   src/03-client/history-proofs
   src/03-client/history-generation
   src/03-client/history-verification
   src/03-client/exit-guarding
   src/03-client/state-queries
   src/03-client/synchronization
   src/03-client/query-expressions
   src/03-client/rpc-methods

.. toctree::
   :maxdepth: 1
   :caption: #04: Client Architecture

   src/04-client-architecture/introduction
   src/04-client-architecture/merkle-interval-tree
   src/04-client-architecture/range-db
   src/04-client-architecture/contract-wrapper
   src/04-client-architecture/event-watcher
   src/04-client-architecture/wallet-db
   src/04-client-architecture/wallet
   src/04-client-architecture/predicate-plugin
   src/04-client-architecture/plugin-manager
   src/04-client-architecture/history-db
   src/04-client-architecture/history-manager
   src/04-client-architecture/state-db
   src/04-client-architecture/state-manager
   src/04-client-architecutre/sync-db
   src/04-client-architecture/sync-manager
   src/04-client-architecture/rpc-client
   src/04-client-architecture/rpc-server


.. toctree::
   :maxdepth: 1
   :caption: #05: Operator Specification

   src/05-operator/introduction
   src/05-operator/transaction-ingestion
   src/05-operator/block-generation
   src/05-operator/operator-rpc-methods
   
.. toctree::
   :maxdepth: 1
   :caption: #06: Operator Architecture

   src/06-operator-architecture/introduction
   src/06-operator-architecture/block-db
   src/06-operator-architecture/block-manager
   src/06-operator-architecture/operator-state-manager

.. toctree::
   :maxdepth: 1
   :caption: #07: Predicate Specifications

   src/07-predicates/ownership-predicate


.. _`Plasma Group`: https://plasma.group
.. _`generalized plasma`: https://medium.com/plasma-group/plapps-and-predicates-understanding-the-generalized-plasma-architecture-fc171b25741

