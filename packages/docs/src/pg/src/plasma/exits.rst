=======================================
Understanding: How exits work on Plasma
=======================================

One of the main ideas of Plasma is the guarantee that you can move any assets or tokens that you own from the plasma chain to the main Ethereum chain. There can be many reasons why you would want to move your tokens out. One simple reason to move your funds out of a Plasma chain could be to do something not supported by the chain. For example, a plasma chain for interacting with Crypto kitties or other collectibles might not be ideal to pay for a coffee.

Another reason you may choose to move out your tokens could be the unlikely but possible case of the failure of the Plasma chain's consensus mechanism. For example, in a proof of authority plasma chain, if you observe that the operator starts to act maliciously, you can be assured that you will not lose your funds and can take them off the plasma chain and anywhere else.

This *ability to exit the chain at any time* is how Plasma is able to provide the **security of the main Ethereum chain** while still allowing cheaper transaction costs, higher transaction throughput and other advantages offered by the Plasma framework.

Deposits and Withdrawals: The basics
====================================

To move your tokens or funds from the main chain to the Plasma chain, you send a transaction with the tokens to the Plasma smart contract on the main chain. The contract then locks the tokens on the main chain and makes an equivalent token on the Plasma chain available to you too. You can spend this Plasma token by sending it to someone else and you can also receive tokens.

When you want to move your token back to the main chain, you send another request to the smart contract with the proofs that you are the owner of the token. This initiates the start of a challenge period during which others may try to invalidate your transaction. If no one is able to successfully challenge your exit transaction, your tokens become available to you on the main chain.

How do Withdrawals work on Plasma
=================================

To move your tokens out to the main chain from the plasma chain, you need to prove that you are the owner of the tokens that you are attempting withdraw.
You can only be the owner of the token if:

1. You received the token from someone (or deposited yourself from the main chain).
2. You have not already spent the token.

Violating 1 would mean that anyone can withdraw and steal your tokens and that would not be secure at all. Violating 2 would mean that double spending is possible. You should not be able to withdraw a token that you have already spent. You don't want either of these conditions to ever be possible.

In this case, how do you prove that you are the rightful owner of the tokens?

To prove ownership, you need to provide details about the last transaction of your token (this is the  transaction in which you received the token). You need to provide a merkle proof of this transaction. You also require a block number after the deposit of the token to the plasma chain. Apart from these details, a bounty amount is also attached by you to your exit request.

This bounty acts as a reward for the challengers to detect and challenge fraudulent exits and encourages people initiating withdrawal requests to be truthful and not try to exit tokens that they don't own. On creating the exit request with all the details and proofs, the challenge period is initiated.

Invalid Withdrawals and the Challenge Mechanism
================================================
Not all withdrawal requests are created equal. Plasma resolves the cases of invalid withdrawals with the help of challenges. The challenge period is a fixed amount of time that begins as soon as a withdrawal request is submitted. It allows other member to view your plasma chains and to challenge invalid exits.

Invalid exit scenario 1 :
-------------------------

A --> B,  B --> C

Let's assume a token is transferred by A to B and then B sends it to C.

If B start an withdrawal request for the token, This would not be valid since B has already spent the token and they no longer own it.

In this scenario, a challenge would be submitted with the transaction proof of B -> C Which immediately cancels that withdrawal and the bounty is provided to the challenger.

Invalid exit scenario 2:
------------------------

A --> B  -x->  C --> D

In this case, D tries to withdraw a token that it claims it received from C. However, the transaction from B to C is invalid or even non existent. This means that the withdrawal request can not be valid.

In this scenario, the withdrawal request is challenged based on the invalid transaction from B to C. D must now either respond with a valid set of transactions showing that B is indeed the valid parent of C. If D is unable to provide a valid response before the end of the challenge period, the withdrawal request is cancelled and again, the challenger receives the attached bounty.

The exit game
=============

This mechanism of withdrawing assets from the plasma chain to the main chain along with the challenge period is also referred to as the exit game. The exit game can vary slightly depending upon the variant of Plasma however the basic ideas and protections offered remain similar. This exit  game as we can see ensures that even in maximal adverse condition (fancy speak for worst case scenario) our tokens remain safe. This mechanism ensures the viability of plasma chains.

Further reading
===============

- https://medium.com/plasma-group/plasma-spec-9d98d0f2fccf
- https://ethresear.ch/t/plasma-cash-with-smaller-exit-procedure-and-a-general-approach-to-safety-proofs/1942
- https://hackernoon.com/eli5-plasma-cash-ff242c55e8de
- https://karl.tech/plasma-cash-simple-spec/
