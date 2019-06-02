############
Introduction
############

**********
Background
**********
.. todo::

   Figure out what background information to provide here.

********************
Specification Layout
********************
We've laid out this specification in a very deliberate way that attempts to mirror the layout of the `Lightning BOLT specifications`_. This layout will hopefully make the specification more readable.

We currently have five primary sections:

- `#00: Introduction`_
- `#01: Core Components`_
- `#02: Contracts`_
- `#03: Client`_
- `#04: Operator`_

Each section covers a relatively self-contained component of the entire spec. We'll quickly explain each section at a high-level.

#00: Introduction
=================
This section covers an introduction to the concepts of generalized plasma and the specification as a whole. Here we discuss the background information that someone might need to understand what the specification is attempting to do. We review plasma, Plasma Cashflow, and the main ideas behind generalized plasma.

#01: Core Components
====================
The generalized plasma construction relies on various core components that are shared between the contracts, client, and operator. We specify these components to provide the fundamental basis for the rest of the specification.

#02: Contracts
==============
All plasma chains need a set of smart contracts sitting on Ethereum. In this section we describe the three main contracts that make up our design. We provide a standard contract interface that implementations must follow and a detailed explanation of the functionality these contracts must provide.

#03: Client
===========
Users need to run client software in order to interact with the plasma chain. We first describe the various functions that this client software needs to provide. We then specify particular components that a client must implement in order to expose this functionality.

#04: Operator
=============
Plasma chains typically have an operator who aggregates transactions into a single block. Our operator design is an extension of the client design. We specify the functions that an operator must provide on top of the base client and the actual components that enable those functions.

************
Housekeeping
************

Source
======
This specification is a living document. You can find the source for this document on the `Plasma Group monorepo`_.

We need your help! At the end of the day, this specification is meant to help others build better plasma chains. If you find anything confusing, please create an `issue on GitHub`_ and let us know how we can help. You're also more than welcome to create a `pull request`_ if you feel like you can fix an issue yourself. We're usually pretty responsive to issues and PRs.

Versioning
==========
Most pages within this specification will continue to evolve as we develop `our implementation`_. We've decided to use `semantic versioning`_ so that it's easy to see and understand the difference between versions of this document.

Our semantic versioning strategy is pretty simple. Changes to this specification that would make an implementation incompatible with implementations of previous versions are split into different `major versions`_. Changes that simply add functionality but don't break backwards compatibility bump the `minor version`_. Finally, fixes that don't add or remove functionality (layout edits, grammatical fixes, typo fixes) bump the `patch version`_.


.. References

.. _`#00: Introduction`: ./introduction.html
.. _`#01: Core Components`: ../01-core/state-system.html
.. _`#02: Contracts`: ../02-contracts/deposit-contract.html
.. _`#03: Client`: ../03-client/introduction.html
.. _`#04: Operator`: ../04-client/introduction.html
.. _`Lightning BOLT specifications`: https://github.com/lightningnetwork/lightning-rfc
.. _`Plasma Group monorepo`: https://github.com/plasma-group/pigi/tree/master/packages/docs/src/spec
.. _`our implementation`: https://github.com/plasma-group/pigi/tree/master/packages/core
.. _`issue on GitHub`: https://github.com/plasma-group/pigi/issues
.. _`pull request`: https://github.com/plasma-group/pigi/pulls
.. _`semantic versioning`: https://semver.org/
.. _`minor version`: https://semver.org/#spec-item-7
.. _`patch version`: https://semver.org/#spec-item-6
.. _`major versions`: https://semver.org/#spec-item8
