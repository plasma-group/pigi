export type JsonRpcParam = string | number
export type JsonRpcResult = string | number | {}

export interface JsonRpcError {
  code: number
  message: string
}

export interface JsonRpcRequest {
  jsonrpc: string
  method: string
  id: string
  params: JsonRpcParam[]
}

export interface JsonRpcResponse {
  jsonrpc: string
  result?: JsonRpcResult
  error?: JsonRpcError
  message?: string
  id: string | null
}

export const isJsonRpcResponse = (obj: any): obj is JsonRpcResponse => {
  return (
    obj.jsonrpc !== undefined &&
    obj.id !== undefined &&
    (obj.result !== undefined || obj.error !== undefined)
  )
}
