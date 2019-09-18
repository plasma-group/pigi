/* External Imports */
import {
  AndDecider,
  BigNumber,
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
  SignedStateReceipt,
  StateReceipt,
} from './index'
import { SignedByDecider } from '@pigi/core/build/src/app/ovm/deciders/signed-by-decider'

const log = getLogger('rollup-ovm')

/**
 * The OVM processor for UniPig-like applications
 */
export class RollupOVM {
  constructor(
    private readonly signedByDB: SignedByDBInterface,
    private readonly signedByDecider: SignedByDecider,
    private readonly merkleInclusionDecider: MerkleInclusionProofDecider = new MerkleInclusionProofDecider(),
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
    // TODO: should we return the decision here and make the caller handle disputes,
    //       or should this handle disputes?
    //       I'm leaning toward this handling disputes.
    return (await this.decideIfStateReceiptIsValid(stateReceipt, signer))
      .outcome
  }

  /**
   * Gets the proof that
   * @param stateReceipt
   * @param signer
   */
  public async getFraudProof(
    stateReceipt: StateReceipt,
    signer: Address
  ): Promise<ImplicationProofItem[]> {
    const decision = await this.decideIfStateReceiptIsValid(
      stateReceipt,
      signer
    )

    return decision ? decision.justification : undefined
  }

  private async decideIfStateReceiptIsValid(
    stateReceipt: StateReceipt,
    signer: Address
  ): Promise<Decision> {
    return AndDecider.instance().decide({
      properties: [
        {
          decider: this.signedByDecider,
          input: {
            publicKey: signer,
            message: abiEncodeStateReceipt(stateReceipt),
          },
        },
        {
          decider: this.merkleInclusionDecider,
          input: {
            merkleProof: {
              rootHash: Buffer.from(stateReceipt.stateRoot),
              key: new BigNumber(stateReceipt.leafID),
              value: abiEncodeState(stateReceipt.state),
              siblings: stateReceipt.inclusionProof.map((x) => Buffer.from(x)),
            },
          },
        },
      ],
    })
  }
}
