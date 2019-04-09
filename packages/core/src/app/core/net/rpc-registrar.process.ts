/* Internal Imports */
import { RpcServer, KeyManager } from '../../../interfaces'
import { Process } from '../../common'
import { CoreRpcRegistrar } from './rpc-registrar'

/**
 * Process that binds RPC methods to specific methods
 * inside the core app.
 */
export class CoreRpcRegistrarProcess extends Process<void> {
  /**
   * Creates the process.
   * @param rpcServer RPC server to register things to.
   * @param keyManager Key management process.
   */
  constructor(
    private rpcServer: Process<RpcServer>,
    private keyManager: Process<KeyManager>
  ) {
    super()
  }

  /**
   * Binds the relevant RPC methods.
   * Waits for RPC server and other processes
   * to be ready before binding methods.
   */
  protected async onStart(): Promise<void> {
    await this.rpcServer.waitUntilStarted()
    await this.keyManager.waitUntilStarted()

    const registrar = new CoreRpcRegistrar(
      this.rpcServer.subject,
      this.keyManager.subject
    )
    registrar.register()
  }
}
