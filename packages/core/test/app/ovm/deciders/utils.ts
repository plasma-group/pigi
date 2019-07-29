import { Decider, Decision } from '../../../../src/types/ovm'
import { CannotDecideError } from '../../../../src/app/ovm/deciders'

export class TrueDecider implements Decider {
  public async checkDecision(input: any): Promise<Decision> {
    return this.decide(input, undefined)
  }

  public async decide(input: any, witness: any): Promise<Decision> {
    return {
      outcome: true,
      justification: [],
    }
  }
}

export class FalseDecider implements Decider {
  public async checkDecision(input: any): Promise<Decision> {
    return this.decide(input, undefined)
  }

  public async decide(input: any, witness: any): Promise<Decision> {
    return {
      outcome: false,
      justification: [],
    }
  }
}

export class CannotDecideDecider implements Decider {
  public async checkDecision(input: any): Promise<Decision> {
    return this.decide(input, undefined)
  }

  public async decide(input: any, witness: any): Promise<Decision> {
    throw new CannotDecideError('Cannot decide!')
  }
}
