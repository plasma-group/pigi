//import * as ganache from 'ganache-cli'
const ganache = require('ganache-cli')
import Web3 from 'web3'
import { Http2Server } from 'http2'
import { Contract } from 'web3-eth-contract'

export interface EthereumOptions {
  port?: number
  gasLimit?: string
}

export class Ethereum {
  private ethereum: Http2Server
  private web3: Web3
  private accounts: string[] 

  constructor({ port = 8545, gasLimit = '0x7A1200' }: EthereumOptions = {}) {
    this.ethereum = ganache.server({ port, gasLimit })
    
    const ganacheAccounts = []
    for (let i = 0; i < 5; i++) {
      const privateKey = '0xc1912fee45d61c87cc5ea59dae311904cd86b84fee17cc96966216f811ce6a7' + i
      ganacheAccounts.push({
        balance: '0x999999999999999999999999991',
        secretKey: privateKey
      })
    }
  
    const providerOptions = { 'accounts': ganacheAccounts, 'locked': false, 'gasLimit': '0x7A1200', 'logger': console, 'debug': true }
    this.web3 = new Web3(ganache.provider(providerOptions));
  }

  /**
   * Starts the Ethereum node.
   */
  public async start(): Promise<void> {
    this.accounts = await this.web3.eth.getAccounts() // cannot be done in synchronous constructor
    await new Promise((resolve) => {
      this.ethereum.listen('8545', resolve)
      //this.ethereum.close(resolve)
    })
  }

  /**
   * Stops the Ethereum node.
   */
  public async stop(): Promise<void> {
    await new Promise((resolve) => {
      //this.ethereum.listen('8545', resolve)
      this.ethereum.close(resolve)
    })
  }

  /**
   * Deploys a compiled contract and returns the contract object.
   */
  public async deployCompiledContract(compiledContract: any): Promise<Contract> {
    const addr: any = this.accounts[0]
    //const undeployedContract = new Contract(this.web3.currentProvider, compiledContract.abi, addr, { from: addr, gas: 7000000, gasPrice: '3000', data: compiledContract.bytecode })
    console.log('abi is:')
    console.log(compiledContract.abi)
    
    const undeployedContract = new this.web3.eth.Contract(compiledContract.abi, addr, {data: compiledContract.bytecode, from: addr, gas: 8000000, gasPrice: '30000000000000'})
    //const a = await undeployedContract.deploy({data: compiledContract.bytecode})
    //console.log(a)
    const depltx: any = await undeployedContract.deploy({data: compiledContract.bytecode})
    console.log('tx is:')
    console.log(depltx.encodeABI())
    depltx.send({from: addr, gas: 8000000, gasPrice: '30'})
    console.log('and here')
    return undeployedContract
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
