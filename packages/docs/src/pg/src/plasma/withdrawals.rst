==============================================
Challenging Invalid Withdrawals in Plasma Cash
==============================================

What are withdrawals?
=====================

Withdrawals or “exits” allow users to retrieve their tokens from the plasma chain to the main chain (ethereum).

How do Withdrawals work?
========================

When a user wishes to withdraw from the sidechain (plasma chain) they submit a withdrawal request which includes the 
transaction in which they received the coin as well as the Merkle proof. Using the Merkle proof, the smart contract can 
verify that this transaction was indeed included in a sidechain block that was previously submitted by the sidechain 
operator. The smart contract also checks the account that signed the sidechain transaction. Each exit also contains a 
bond which covers the gas cost of a challenge plus a bounty for proving invalidity.

Ethereum smart contracts cannot produce signatures, and therefore cannot spend funds on the Plasma chain. However, 
Ethereum contracts can initiate an exit by calling the Plasma contract, this makes it possible for a user to send child 
chain funds to the address of an Ethereum contract, where these funds can no longer be spent but can be withdrawn.

When a user wants to withdraw a token, they need to submit the two latest transactions in the token’s history. For 
example, if C wants to withdraw token #4, they need to provide the “child” (most recent) transaction from B to C, and 
the “parent” transaction from A to B.

What makes withdrawals invalid?
===============================

If a user is trying to withdraw a token they owned but later spent, for example in block 4 they got the token then in 
block 5 they spent it but only submitted block 4 and the previous one during withdrawal.

If a user provides invalid parent/child then also the tx would be considered invalid. 

Plasma chain smart contracts can't tell whether an exit is invalid or not, rather it is decided by a zero sum game 
between exitor and challenger.

How Challenges can be used to prevent invalid withdrawals?
==========================================================

Withdrawals can be immediately blocked if someone challenges the withdrawing user by showing proof of user spending the 
token later on. Withdrawals can also be immediately blocked if someone shows that there’s a transaction between the 
parent and the child transactions, meaning the withdrawing user provided an invalid parent.

Someone can also challenge the withdrawal by providing some other transaction in the token’s history. This type of 
challenge doesn’t immediately block a withdrawal. Instead, the withdrawing user is forced to respond with the transaction 
that comes after the provided transaction.

Exit diagrams similar to this can be found at_:

.. _at: https://karl.tech/plasma-cash-simple-spec/
