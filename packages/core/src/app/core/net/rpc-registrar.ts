/* Internal Imports */
import { RpcServer, KeyManager } from '../../../interfaces'
import { registerBound } from '../../common'

/**
 * Registers RPC methods for the core app.
 */
export class CoreRpcRegistrar {
  /**
   * Creates the registrar.
   * @param rpcServer Server to register to.
   * @param keyManager Key manager instance.
   */
  constructor(private rpcServer: RpcServer, private keyManager: KeyManager) {}

  /**
   * Registers RPC methods.
   */
  public register(): void {
    registerBound(this.rpcServer, this.keyManager, [
      'createAccount',
      'getAccounts',
      'lockAccount',
      'sign',
      'unlockAccount',
    ])
  }
}
