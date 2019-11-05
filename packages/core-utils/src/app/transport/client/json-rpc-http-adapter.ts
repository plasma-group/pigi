import {
  JsonRpcAdapter,
  JsonRpcRequest,
  JsonRpcResponse,
  HttpRequest,
  HttpResponse,
} from '../../../types'

/**
 * Adapter for using JSON-RPC over HTTP.
 */
export class JsonRpcHttpAdapter
  implements JsonRpcAdapter<HttpRequest, HttpResponse> {
  /**
   * Creates an HTTP request from a JSON-RPC request.
   * @param request JSON-RPC request to encode.
   * @returns the encoded HTTP request.
   */
  public encodeRequest(request: JsonRpcRequest): HttpRequest {
    return {
      url: '',
      method: 'post',
      data: request,
    }
  }

  /**
   * Decodes an HTTP response into a JSON-RPC response.
   * @param response HTTP response to decode.
   * @returns the decoded JSON-RPC response.
   */
  public decodeResponse(response: HttpResponse): JsonRpcResponse {
    return response.data
  }
}
