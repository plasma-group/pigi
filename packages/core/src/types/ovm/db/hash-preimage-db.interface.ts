import { HashAlgorithm } from '../../utils'

export interface HashPreimageDbInterface {
  /**
   * Calculates and stores the hash and provided preimage using the provided
   * HashAlgorithm for future lookup.
   *
   * @param preimage The preimage to store
   * @param hashAlgorithm The HashAlgorithm in question
   */
  storePreimage(preimage: Buffer, hashAlgorithm: HashAlgorithm): Promise<void>

  /**
   * Retrieves the preimage for the provided hash, using the provided HashAlgorithm,
   * if one has been stored.
   *
   * @param hash The hash in question
   * @param hashAlgorithm The algorithm used
   * @returns The preimage, if one is known, for the provided hash
   */
  getPreimage(
    hash: Buffer,
    hashAlgorithm: HashAlgorithm
  ): Promise<Buffer | undefined>
}
