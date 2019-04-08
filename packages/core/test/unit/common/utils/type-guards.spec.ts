import '../../../setup'

/* Internal Imports */
import {
  JsonRpcErrorResponse,
  JsonRpcSuccessResponse,
  JsonRpcRequest,
} from '../../../../src/interfaces'
import {
  isJsonRpcErrorResponse,
  isJsonRpcRequest,
} from '../../../../src/app/common'

describe('Type Guards', () => {
  describe('isJsonRpcErrorResponse', () => {
    it('should correctly identify an error response', () => {
      const response: JsonRpcErrorResponse = {
        jsonrpc: '2.0',
        error: {
          code: 123,
          message: 'error',
        },
        id: '456',
      }

      isJsonRpcErrorResponse(response).should.be.true
    })

    it('should correctly identify a non-error response', () => {
      const response: JsonRpcSuccessResponse = {
        jsonrpc: '2.0',
        result: 'ok',
        id: '456',
      }

      isJsonRpcErrorResponse(response).should.be.false
    })
  })

  describe('isJsonRpcRequest', () => {
    it('should correctly identify a JSON-RPC request', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'something',
        params: 123,
        id: '456',
      }

      isJsonRpcRequest(request).should.be.true
    })

    it('should correctly identify a request without jsonrpc', () => {
      const request: Partial<JsonRpcRequest> = {
        method: 'something',
        params: 123,
        id: '456',
      }

      isJsonRpcRequest(request).should.be.false
    })

    it('should correctly identify a request with wrong jsonrpc', () => {
      const request = {
        jsonrpc: '123456',
        method: 'something',
        params: 123,
        id: '456',
      }

      isJsonRpcRequest(request).should.be.false
    })
    it('should correctly identify a request without a method', () => {
      const request: Partial<JsonRpcRequest> = {
        jsonrpc: '2.0',
        params: 123,
        id: '456',
      }

      isJsonRpcRequest(request).should.be.false
    })

    it('should correctly identify a request without an id', () => {
      const request: Partial<JsonRpcRequest> = {
        jsonrpc: '2.0',
        method: 'something',
        params: 123,
      }

      isJsonRpcRequest(request).should.be.false
    })
  })
})
