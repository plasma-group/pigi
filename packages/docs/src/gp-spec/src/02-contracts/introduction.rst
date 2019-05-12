############################
Generalized Plasma Framework
############################

**********
Background
**********
`Plasma Group's work`_ regarding a system for representing more generalized state transitions within `Plasma Cashflow`_ turns out to be equally applicable to many other plasma constructions. We've distilled these learnings into a general-purpose framework. By utilizing this framework, one can build plasma chains that fall into many different families, including `Plasma MVP`_ and `Plasma Cash`_.

This framework provides several different base components that can be combined to create various plasma systems. For anyone interested in understanding how this framework can be applied, we've `specified our own Plasma Cashflow construction`_ which is also based on this framework.

********
Overview
********
Plasma chains generally need to handle three major functions: deposits, block commitments, and exits. Plasma chains previously bundled all of this functionality into a single monolothic smart contract. Our framework instead breaks these components into three separate components that each serve a very particular purpose.

Deposits
========
Plasma chains must support some functionality that allows a user to deposit funds into the plasma chain. One would be correct to intuit that deposits are intimately connected to the rest of the plasma system. However, we can create a much more powerful model if we break this intuition down.

What we typically think of "depositing" into a plasma chain is really just locking up some funds into a smart contract on Ethereum. These funds can then be withdawn in some manner specified by the smart contract. However, the actual manner in which funds are withdrawn is pretty much entirely arbitary. Every unique plasma construction defines its own rules about who can withdraw which assets.

It seems that there are actually two things going on here. On one hand, we have the low-level logic of transferring assets to and from the plasma chain. This is where we handle things like ERC20 transfers or ``ETH`` sends. This logic is very portable between different plasma chains. On the other hand, we have the logic that determines **when** an asset may be sent. This logic is going to be different for each plasma chain.

When we break out the first component from the second, we arrive at an interesting construction. We can define a **deposit contract** that doesn't know anything about the conditions under which it may disburse funds. Instead, it delegates this responsibility to another contract which we discuss later.

Blocks
======
The second major responsibility of the plasma chain contract is to accept **block headers**. Generally, we have two sub-components that support this functionality.

Block Header Authentication
---------------------------
Plasma chains define some logic that authenticates a given block header. Since most plasma chains have been constructed for a single operator, this tends to be a check that ``msg.sender`` is the operator. Our framework breaks this logic out into its own component that can carry out arbitrary checks. This allows us to implement more complex authentication logic without modifying the rest of the system.

Block Header Storage
--------------------
We can also separate out the functionality of actually storing block commitments. This functionality tends to be very portable between plasma chains. It also tends to remain fixed, even if block header authentication logic changes.

Exits
=====
Exits are the final component to any plasma system. Exits make it possible for auser with withdraw funds from the plasma chain. Again, instead of tightly coupling exits with the rest of the system, we place them into their own component.

Each **deposit contract** will specify some **exit contract** that will control how funds can be withdrawn from the deposit contract. The deposit contract doesn't need to know how the exit contract works, and the exit contract doesn't need to know how the deposit contract works.

.. _`Plasma Group's work`: TODO
.. _`Plasma Cashflow`: TODO
.. _`Plasma MVP`: TODO
.. _`Plasma Cash`: TODO
.. _`specified our own Plasma Cashflow construction`: TODO

