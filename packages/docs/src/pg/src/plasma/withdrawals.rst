==============================================
Challenging Invalid Withdrawals in Plasma Cash
==============================================

What are withdrawals
====================

Withdrawals or "exits" allow users to retrieve their tokens from the plasma chain to the mainchain (ethereum).

How Withdrawals work
====================

When a user wishes to withdraw from the plasma chain they submit a withdrawal request which includes the
transaction in which they received the coin as well as the Merkle proof. Using the Merkle proof, the smart contract can
verify that this transaction was indeed included in a plasma chain block that was previously submitted by the operator, the smart contract also checks the account that signed the transaction. Each exit contains a
bond which covers the gas cost of a challenge plus a bounty for proving invalidity.

Ethereum smart contracts cannot produce signatures, and therefore cannot spend funds on the Plasma chain. However,
Ethereum contracts can initiate an exit by calling the Plasma contract, this makes it possible for a user to send child
chain funds to the address of an Ethereum contract, where these funds can no longer be spent, but can be withdrawn.

When a user wants to withdraw a token, they need to submit the two latest transactions in the token’s history. For
example, if C wants to withdraw token #4, they need to provide the "child" (most recent) transaction from B to C, and
the "parent" transaction from A to B.

What makes withdrawals invalid
==============================

An invalid withdrawal is when a user tries to withdraw a token they owned but later spent. For example in block 4 they received a token, then in block 5 they spent it but only submitted block 4 and the previous one during withdrawal.

Another example is if a user provides an invalid parent or child.

Plasma chain smart contracts can't tell whether an exit is invalid or not, rather it is decided by a zero sum game
between the exitor and challenger.

Using Challenges to prevent invalid withdrawals
===============================================

Withdrawals are blocked if someone challenges the withdrawing user by showing proof of the user spending the
token later. Withdrawals are also blocked if someone shows that there's a transaction between the
parent and the child transactions, meaning the withdrawing user provided an invalid parent.

Someone can challenge the withdrawal by providing some other transactions in the token's history. This type of
challenge doesn't immediately block a withdrawal. Instead, the withdrawing user is forced to respond with the transaction
that comes after the provided transaction.

You can find similar exit diagrams on Karl Floersch's blog_:

.. _blog: https://karl.tech/plasma-cash-simple-spec/
