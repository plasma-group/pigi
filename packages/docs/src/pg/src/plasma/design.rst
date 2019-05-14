=============================================================================
How Plasma Cash like designs makes it possible for clients to be lightweight?
=============================================================================


Plasma Cash gets its name because it’s perceived to act similar to cash — i.e.bills that cannot be divided or cut up to 
represent different values. Right now, we have “bills” that are denominated in standard values, such as $10, $20, $50, and 
$100, and are represented as **non-fungible tokens(NFTs)**. Each deposit into the Plasma Cash smart contract will be treated 
like a bill and indivisible. Plasma Cash utilizes unique identifiers when depositing ETH into a Plasma contract that 
allows users to only store information about their coin. But even then, the storage requirements from a user standpoint 
can be excessive, as one is required to store and maintain an ever-growing history of transactions, inclusion proofs, and 
non-inclusion proofs.

One of these NFTs (aka “coins”) could represent anything: fixed denominations of ether or an ERC-20 token, a bundle of 
ERC-20 tokens, a litter of cryptokitties. The only requirement is that it can be represented as an ERC-721 asset — which 
essentially just means it is something unique that can’t be split or merged.

Plasma Cash ditches the Bitcoin-esque UTXO(Unspent Transaction Output) model of MVP(Minimum Viable Plasma) with non-fungible 
coins, the notion of creating new transaction outputs no longer applies. Instead, each coin is accounted for in each Plasma 
block: presence of a coin indicates that the coin changed owners in that Plasma block (i.e., Alice sent it over to Bob); 
absence indicates that it still has the same owner as it did in the previous block. Thus, the full history of a coin can be 
described by its absence or presence in each Plasma block, from the current block all the way back to the block in which 
it was first deposited.

Source: https://www.learnplasma.org/en/learn/cash.html

In order for Bob to prove the presence of his coin in a given block, he only needs the transaction’s Merkle path. However, 
to prove that the coin was not transferred in a given block, Bob requires the ability to prove absence of data, a feature 
not supported by the Merkle Trees we know and love.

.. figure:: ../../_static/images/merkleInclusion.png
    :align: center
    :target: ../../_static/images/merkleInclusion.png

*A diagram of Merkle tree*

Thus, to enable this “proof of absence” capability, Plasma Cash uses a souped-up Merkle Tree construct known as a Sparse 
Merkle Tree. SMTs are Merkle trees with an additional, special feature: the leaves of the tree (the coins, in our case) 
are each given a unique identification number which determines where in the tree they reside. Essentially, a sorted 
ordering is imposed on them; each coin can only reside in its allotted “slot”. What this means is that if a coin is absent, 
we know where it would be if it were present, and thus, we are able to prove its absence with a Merkle branch that shows 
that its slot is “empty” (i.e., equal to some null value — zero, “undefined,” whatever).

The key takeaway being that the data requirement for proving this history consists of only one bite-sized Merkle proof per 
block, as opposed to MVP’s full Plasma blocks requirement. Plasma light client secured!

Let’s now explore the claim that this sequence of Merkle proofs is enough for the coin’s current owner to secure their 
funds. In other words, as long as Steve has the full history of his coin (in the form described above), he has objective 
assurance that:

1. If/when he tries to withdraw, he will have the appropriate response to any challenges.

2. If/when anyone else tries to withdraw his coin, he’ll be able to challenge and successfully overturn the withdrawal.

**Sparse Merkle Trees**

Sparse Merkle trees are really cool because they give us efficient proofs of non-inclusion. A sparse Merkle tree is like a 
standard Merkle tree, except the contained data is indexed, and each datapoint is placed at the leaf that corresponds to 
that datapoint’s index.

Let’s prove that A is part of the above tree. All we need to do is provide each of A’s siblings on the way up, recompute 
the tree, and make sure everything matches.
With just A, H(B), and H(H(C)+H(D)), we can recompute the original root hash. This is an efficient way to show that A is 
part of this tree without having to provide the entire tree!
So we can easily prove that something is part of the Merkle tree, but what if we want to prove that something isn’t part of 
the tree? Unfortunately, standard Merkle trees don’t give us any good way to do this. We could reveal the entire contents, 
but that’s sort of defeating the point of using a Merkle tree in the first place.

Here’s where the magic happens. What happens if we want to prove that C is not part of this Merkle tree? It’s easy! We know 
that if C were part of the tree, it would be at the third leaf. If C isn’t part of the tree, then the third leaf must be 
null.

All we need is a standard Merkle proof showing the third leaf is null!

.. figure:: ../../_static/images/nonInclusion.png
    :align: center
    :target: ../../_static/images/nonInclusion.png

Luckily, there are some techniques to efficiently generate Merkle trees. The key to these techniques is that these giant 
sparse Merkle trees are mostly… sparse. H(null) is a constant value, and so is H(H(null)), etc. etc. Huge chunks of the 
tree can be cached!

Source: Efficient smt:https://eprint.iacr.org/2016/683.pdf 


**How this design is helpful**

*Sharded client-side validation*

Clients only need to watch the Plasma chain for their tokens. That means transaction 
throughput can scale without increased load on individual users.

*Minor Mass Exit Mitigation* 

Mass exits are slightly less worrisome because a thief must submit an exit transaction for 
each token they wish to steal. If a chain halts tokens are still safe; however, there is still an interruption in service.

*Simple support for all tokens*

There is no additional complexity adding any number distinct tokens, including non-fungible assets, a downside is *Large token denominations* 

Because each token must be assigned a serial number, one cannot mint arbitrarily small tokens. 
This is because at some point the gas cost of redeeming the token will be larger than the value of the token itself.

*Transactions Format*

For every block in the Plasma Cash chain, a merkle root must be published to the root chain. This root can either be a 
merklized list, or a merkle patricia tree. In the merklized list, each index of the leaf nodes corresponds to the token ID. 
The values of the leaf nodes are Plasma transactions.

Transactions take the form of:

``[[prev_hash, prev_block, (target_block?), token_id, new_owner], signature]``

A transaction spending a token with a given token_id is only valid if it is included in the Merkle tree at position 
token_id; that is, for each token, there is only one "place" in the Merkle tree where transactions spending that token are 
allowed to be.
 

**Deposits**

Anyone can call a deposit() function of the Plasma contract, which mints a new token into existence with the amount of 
ether sent along with the call as the denomination;

**Withdrawals**

*Starting an Exit*

When a user wants to withdraw a token, they need to submit the two latest transactions in the token’s history. For example, 
if C wants to withdraw token #4, they need to provide the “child” (most recent) transaction from B to C, and the “parent” 
transaction from A to B. The user also needs to submit Merkle proofs that show both transactions were included in the 
blockchain.

*Challenging exits*

We need to support three types of challenges to ensure that only the true owner of a token can withdraw that token. 

1.  Withdrawals can be immediately blocked if someone proves that the withdrawing user actually spent the token later on. 

2.  Withdrawals can also be immediately blocked if someone shows that there’s a transaction between the parent and the child 
    transactions, meaning the withdrawing user provided an invalid parent.

3.  Someone can also challenge the withdrawal by providing some other transaction in the token’s history. This type of 
    challenge doesn’t immediately block a withdrawal. Instead, the withdrawing user is forced to respond with the transaction 
    that comes after the provided transaction.

*Exiting The Chain*

.. figure:: ../../_static/images/blocks.png
    :align: center
    :target: ../../_static/images/blocks.png

Anyone can exit their coin by providing the last two transactions in the coin’s ownership history (ie. the coin they are 
exiting C and its parent P( C )).

An exit can be challenged in three ways:

#. Provide a proof of a transaction spending C, 

#. Provide a proof of a transaction spending P( C ) that appears before C,

#. Provide a transaction C* in the coin’s history before P( C )

A challenge of type (i) and (ii) blocks the exit immediately. A challenge of type (iii) can be responded to by providing 
the direct child of C*, which must be either equal to or before P( C )


*Pros and cons*

Plasma Cash is unsuitable for use cases where fractions of tokens are necessary, like exchanges.

Additionally, the proofs that need to be sent along with each transaction can grow pretty quickly. These proofs need to go 
all the way back to the block in which the token was deposited. Once the Plasma Chain has been running for a while, these 
proofs might get prohibitively large.

Plasma Cash is still great for certain things. Support for non-fungible tokens makes Plasma Cash perfect for things like 
supply-chain logistics or even card games!.
