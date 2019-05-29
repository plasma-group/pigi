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

.. toctree::
   :maxdepth: 1
   :caption: #01: Core Design Components

   src/01-core/state-system
   src/01-core/coin-ranges
   src/01-core/merkle-interval-tree
   src/01-core/double-layer-tree
   src/01-core/json-rpc

.. toctree::
   :maxdepth: 1
   :caption: #02: Contract Specification

   src/02-contracts/deposit-contract
   src/02-contracts/commitment-contract
   src/02-contracts/predicate-contract

.. toctree::
   :maxdepth: 1
   :caption: #03: Client Specification

   src/03-client/introduction
   src/03-client/architecture
   src/03-client/deposit-generation
   src/03-client/event-handling
   src/03-client/state-queries
   src/03-client/transaction-generation
   src/03-client/history-generation
   src/03-client/history-verification
   src/03-client/history-proof-structure
   src/03-client/exit-guarding
   src/03-client/query-expressions
   src/03-client/merkle-interval-tree
   src/03-client/range-db
   src/03-client/contract-wrapper
   src/03-client/event-watcher
   src/03-client/wallet-db
   src/03-client/wallet
   src/03-client/predicate-plugin
   src/03-client/plugin-manager
   src/03-client/history-db
   src/03-client/history-manager
   src/03-client/state-db
   src/03-client/state-manager
   src/03-client/rpc-client
   src/03-client/rpc-server
   src/03-client/rpc-methods

.. toctree::
   :maxdepth: 1
   :caption: #04: Operator Specification

   src/04-operator/introduction
   src/04-operator/architecture
   src/04-operator/transaction-ingestion
   src/04-operator/block-generation
   src/04-operator/block-db
   src/04-operator/block-manager
   src/04-operator/operator-state-manager
   src/04-operator/operator-rpc-methods
   
.. toctree::
   :maxdepth: 1
   :caption: #05: Predicate Specifications

   src/05-predicates/ownership-predicate

.. _`Plasma Group`: https://plasma.group
.. _`generalized plasma`: https://medium.com/plasma-group/plapps-and-predicates-understanding-the-generalized-plasma-architecture-fc171b25741

