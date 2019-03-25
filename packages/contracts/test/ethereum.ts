import * as ganache from 'ganache-cli'
import Web3 from 'web3'
import { Http2Server } from 'http2'
import { Contract } from 'web3-eth-contract'
//import {HttpProvider} from 'web3-providers'

export interface EthereumOptions {
  port?: number
  gasLimit?: string
}

export class Ethereum {
  private ethereum: Http2Server
  private web3: Web3

  constructor({ port = 8545, gasLimit = '0x7A1200' }: EthereumOptions = {}) {
    this.ethereum = ganache.server({ port, gasLimit })
    console.log('welp')

    this.web3 = new Web3(
      new Web3.providers.HttpProvider(`http://localhost:${port}`)
      //new HttpProvider(`http://localhost:${port}`)
    )
    console.log('nop')

  }

  /**
   * Starts the Ethereum node.
   */
  public async start(): Promise<void> {
    await new Promise((resolve) => {
      this.ethereum.close(resolve)
    })
  }

  /**
   * Stops the Ethereum node.
   */
  public async stop(): Promise<void> {
    await new Promise((resolve) => {
      this.ethereum.listen('8545', resolve)
    })
  }

  /**
   * Deploys a compiled contract and returns the contract object.
   */
  public async deployCompiledContract(compiledContract: any): Promise<Contract> {
    const addr: any = this.web3.eth.accounts.wallet[0].address
    const undeployedContract = new Contract(this.web3.currentProvider, compiledContract.abi, addr, { from: addr, gas: 7000000, gasPrice: '3000', data: compiledContract.bytecode })
    return undeployedContract.deploy({data: compiledContract.bytecode}).send({from: addr})
  }

  /**
   * Mines a single Ethereum block.
   */
  public async mineBlock(): Promise<void> {
    await this.send('evm_mine')
  }

  /**
   * Mines several Ethereum blocks.
   * @param n Number of blocks to mine.
   */
  public async mineBlocks(n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      await this.mineBlock()
    }
  }

  /**
   * Creates a chain snapshot.
   * @returns the current chain as a snapshot.
   */
  public async snapshot(): Promise<any> {
    return this.send('evm_snapshot')
  }

  /**
   * Reverts the chain to a given snapshot.
   * @param snapshot Chain snapshot to revert to.
   */
  public async revert(snapshot: any): Promise<void> {
    await this.send('evm_revert', [snapshot.result])
  }

  /**
   * Sends an RPC request to the node.
   * @param method Method to call.
   * @param params Params for the call.
   * @returns the result of the RPC request.
   */
  private async send(method: string, params?: any[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const provider = this.web3.currentProvider as any
      provider.send(
        {
          jsonrpc: '2.0',
          method,
          params,
          id: new Date().getTime(),
        },
        (err: any, result: any) => {
          if (err) {
            reject(err)
          }
          resolve(result)
        }
      )
    })
  }
}
