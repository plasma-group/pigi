=============================================
Plasma Group Generalized Plasma Specification
=============================================
`Plasma Group`_ has developed a construction for a generalized `plasma chain`_. Plasma is a complex framework for `layer 2 blockchain systems`_ that scale significantly without sacrificing security. The Plasma Group generalized plasma design vastly expands upon the capabilities of existing plasma designs.

This is a complete specification of the generalized plasma design. We've attempted to provide rationale for our decisions in as many places as possible. Unfortunately we've also operating with a lot of context that you, the reader, may not have. Please reach out to us or `create an issue`_ if you'd like to give us some feedback!

.. toctree::
   :maxdepth: 2
   :caption: 00 - Introduction

   src/00-introduction/plasma
   src/00-introduction/plasma-cashflow
   src/00-introduction/generalized-plasma

.. toctree::
   :maxdepth: 2
   :caption: 01 - State Representation
   
   src/01-state/coin-ranges
   src/01-state/state-updates
   src/01-state/index-tree

.. toctree::
   :maxdepth: 2
   :caption: 02 - Contract Specifications

   src/02-contracts/deposit-contract
   src/02-contracts/commitment-contract
   src/02-contracts/predicate-contract

.. _`Plasma Group`: https://plasma.group
.. _`plasma chain`: https://plasma.io
.. _`layer 2 blockchain systems`: TODO
.. _`create an issue`: https://github.com/plasma-group/pigi/issues
