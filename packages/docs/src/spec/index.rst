=============================================
Plasma Group Generalized Plasma Specification
=============================================
`Plasma Group`_ is working on a `generalized plasma`_ construction that supports significantly more functionality than alternative plasma chains.
Generalized plasma chains are complex objects of study.
This website documents the entirety of the Plasma Group design, from the inner workings of the client to the specifics of the plasma smart contract.

.. toctree::
   :maxdepth: 2
   :caption: Overview

   src/overview/introduction

.. toctree::
   :maxdepth: 2
   :caption: Core Design Components

   src/core/plasma-cashflow
   src/core/index-tree
   src/core/predicates

.. toctree::
   :maxdepth: 2
   :caption: Contract Specification

   src/contracts/deposit
   src/contracts/commitment
   src/contracts/predicate

.. toctree::
   :maxdepth: 2
   :caption: Client Specification

   src/client/architecture
   src/client/deposit-generation
   src/client/transaction-generation
   src/client/query-generation
   src/client/event-handling
   src/client/predicate-plugins
   src/client/range-db
   src/client/state-db
   src/client/history-db
   src/client/account-db
   src/client/sync-db
   src/client/wallet
   src/client/state-manager
   src/client/history-manager
   src/client/event-watcher
   src/client/rpc-server
   src/client/rpc-methods
   
.. toctree::
   :maxdepth: 2
   :caption: Operator Specification

   src/operator/architecture
   src/operator/transaction-ingestion
   src/operator/block-generation
   src/operator/block-db
   src/operator/operator-state-manager
   src/operator/operator-block-manager
   src/operator/rpc-methods

