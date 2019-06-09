############
Introduction
############

Hello and welcome to `Plasma Group`_'s Generalized Plasma Specification! We've been working toward this spec for a long time now and we're excited to be able to share it with the public. We're going to kick the spec off with a high-level overview of our construction and then go into the structure of the spec itself.

*****
TL;DR
*****
`Plasma`_ is basically a way to build blockchains on top of blockchains. Plasma chains are sort of like `sidechains`_, except they're a little less flexible and a lot more secure. We won't go into the details here.

Up until now, people have only been able to build very limited plasma chains that accomplish a few specific goals (like make payments or exchange assets). None of these chains support the sort of "smart contracts" that make Ethereum so useful. In order to build a "plasma application", you'd have to build an entire blockchain from scratch. That's obviously way too much work.

So we set out to design a general purpose chain. It took a lot of work, but we finally arrived at a design we're happy with (and that's what we've specified here!). Now, with this new design, developers can build apps and run them on top of a general purpose plasma chain instead of having to build an entire plasma chain from scratch. It's sort of like the jump of going from Bitcoin to Ethereum.

*****************************
Required Background Knowledge
*****************************
You're going to see a lot of terms and ideas from previous plasma research when you're reading through this specification. Although we've provided references to these terms or ideas wherever possible, we generally try to avoid rehashing what's already been explained well before. As a result, you should be familiar with the general theory behind plasma and with various specific plasma constructions (like `Plasma MVP`_ and `Plasma Cash`_) before diving into this spec.

You don't need an extremely deep knowledge of plasma, but you should be comfortable with the idea of deposits, exits, and exit games. If you're not familiar with these concepts yet, we recommend reading through the original `Plasma MVP`_ and `Plasma Cash`_ posts, as well as the content on `LearnPlasma`_.

Sometimes we have a little trouble remembering that readers don't have quite as much context as we do. If you feel familiar with these concepts but are still confused by some aspect of the spec, please let us know! `We've set up a system`_ that makes it easy for anyone to leave review comments in just a few seconds.

*******************
Specification Goals
*******************
This specification should be detailed, concise, and contained. Readers should have a very clear idea of the system as a whole without relying on guesswork about how a specific mechanism functions. Similarly, developers should be able to create a compliant implementation simply by reading through the specification.

If at any time you feel we haven't quite achieved that goal, please let us know! We're always open to constructive criticism. If you find something confusing, it's likely that others do too.

***********************
Specification Structure
***********************
We've laid out this specification in a very deliberate way that attempts to mirror the layout of the `Lightning BOLT specifications`_.

Our specification is composed of eight primary sections:

- `#00: Introduction`_
- `#01: Core Design Components`_
- `#02: Contract Specifications`_
- `#03: Client Specification`_
- `#04: Operator Specification`_
- `#05: Client Architecture`_
- `#06: Operator Architecture`_
- `#07: Predicate Specifications`_

The first five sections (00 - 04) form the specification of the generalized plasma system itself. These sections explain, in detail, how the system works and what components someone would have to include in a compliant implementation.

The last three sections (05 - 07) describe the architecture for Plasma Group's implementation of the specification. A developer would **NOT** have to use the same architecture in their own implementation, but it may be useful in order to better understand how certain components are supposed to function. Someone who's primarily interested in understanding the system at a high-level could skip these sections.

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

Our semantic versioning strategy is pretty simple, each version follows the format ``major.minor.patch``. Changes to this specification that would make an implementation incompatible with implementations of previous versions are split into different `major versions`_. Changes that simply add functionality but don't break backwards compatibility bump the `minor version`_. Finally, fixes that don't add or remove functionality (layout edits, grammatical fixes, typo fixes) bump the `patch version`_.


.. References

.. _`#00: Introduction`: ./introduction.html
.. _`#01: Core Design Components`: ../01-core/state-system.html
.. _`#02: Contract Specifications`: ../02-contracts/deposit-contract.html
.. _`#03: Client Specification`: ../03-client/introduction.html
.. _`#04: Operator Specification`: ../04-operator/introduction.html
.. _`#05: Client Architecture`: ../05-client-architecture/introduction.html
.. _`#06: Operator Architecture`: ../06-operator-architecture/introduction.html
.. _`#07: Predicate Specifications`: ../07-predicates/introduction.html
.. _`Plasma Group`: https://plasma.group
.. _`Lightning BOLT specifications`: https://github.com/lightningnetwork/lightning-rfc
.. _`Plasma Group monorepo`: https://github.com/plasma-group/pigi
.. _`we've set up a system`: https://www.notion.so/Plasma-Group-Generalized-Plasma-Specification-Information-for-Reviewers-d7f42ae99acb4bf2af571bf348e861a0
.. _`LearnPlasma`: https://learnplasma.org
.. _`Plasma Cash`: https://ethresear.ch/t/plasma-cash-plasma-with-much-less-per-user-data-checking/1298
.. _`Plasma MVP`: https://ethresear.ch/t/minimal-viable-plasma/426
.. _`sidechains`: https://en.bitcoin.it/wiki/Sidechain
.. _`plasma`: https://plasma.io
.. _`our implementation`: https://github.com/plasma-group/pigi/tree/master/packages/core
.. _`issue on GitHub`: https://github.com/plasma-group/pigi/issues
.. _`pull request`: https://github.com/plasma-group/pigi/pulls
.. _`semantic versioning`: https://semver.org/
.. _`minor version`: https://semver.org/#spec-item-7
.. _`patch version`: https://semver.org/#spec-item-6
.. _`major versions`: https://semver.org/#spec-item8
