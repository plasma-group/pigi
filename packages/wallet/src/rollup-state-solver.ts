/* External Imports */
import {
  AndDecider,
  BigNumber,
  Decider,
  Decision,
  DefaultSignatureVerifier,
  getLogger,
  ImplicationProofItem,
  MerkleInclusionProofDecider,
  SignatureVerifier,
  SignedByDBInterface,
} from '@pigi/core'

/* Internal Imports */
import {
  abiEncodeState,
  abiEncodeStateReceipt,
  Address,
  RollupStateSolver,
  SignedStateReceipt,
  StateReceipt,
} from './index'

const log = getLogger('rollup-ovm')

/**
 * The OVM processor for UniPig-like applications
 */
export class DefaultRollupStateSolver implements RollupStateSolver {
  constructor(
    private readonly signedByDB: SignedByDBInterface,
    private readonly signedByDecider: Decider,
    private readonly merkleInclusionDecider: Decider = new MerkleInclusionProofDecider(),
    private readonly signatureVerifier: SignatureVerifier = DefaultSignatureVerifier.instance()
  ) {}

  /**
   * Stores the SignedStateReceipt
   * @param signedReceipt The signed receipt
   */
  public async storeSignedStateReceipt(
    signedReceipt: SignedStateReceipt
  ): Promise<void> {
    const signer = this.signatureVerifier.verifyMessage(
      abiEncodeStateReceipt(signedReceipt.stateReceipt),
      signedReceipt.signature
    )
    await this.signedByDB.storeSignedMessage(
      Buffer.from(signedReceipt.signature),
      Buffer.from(signer)
    )
  }

  /**
   * Determines whether or not the provided StateReceipt is valid, checking that
   * there is a signature for it, and it has a valid inclusion proof.
   * @param stateReceipt
   * @param signer
   */
  public async isStateReceiptProvablyValid(
    stateReceipt: StateReceipt,
    signer: Address
  ): Promise<boolean> {
    return (await this.decideIfStateReceiptIsValid(stateReceipt, signer))
      .outcome
  }

  /**
   * Gets the proof that the provided state receipt is valid.
   * @param stateReceipt The State Receipt in question
   * @param signer The Signer of the StateReceipt
   * @returns The implication proof items of state receipt being valid, else undefined
   */
  public async getFraudProof(
    stateReceipt: StateReceipt,
    signer: Address
  ): Promise<ImplicationProofItem[]> {
    const decision = await this.decideIfStateReceiptIsValid(
      stateReceipt,
      signer
    )

    return decision.outcome ? decision.justification : undefined
  }

  private async decideIfStateReceiptIsValid(
    stateReceipt: StateReceipt,
    aggregator: Address
  ): Promise<Decision> {
    return AndDecider.instance().decide({
      properties: [
        {
          decider: this.signedByDecider,
          input: {
            publicKey: Buffer.from(aggregator),
            message: Buffer.from(abiEncodeStateReceipt(stateReceipt)),
          },
        },
        {
          decider: this.merkleInclusionDecider,
          input: {
            merkleProof: {
              rootHash: Buffer.from(stateReceipt.stateRoot),
              key: new BigNumber(stateReceipt.slotIndex),
              value: abiEncodeState(stateReceipt.state),
              siblings: stateReceipt.inclusionProof.map((x) => Buffer.from(x)),
            },
          },
        },
      ],
    })
  }
}
