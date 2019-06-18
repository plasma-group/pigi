import { should } from '~test/setup'

/* External Imports */
import express = require('express')
import bodyParser = require('body-parser')
import stringify = require('json-stringify-safe')

/* Internal Imports */
import { AxiosHttpClient } from '~app/common/net/transport/http/axios-http-client'

const startPingServer = async (port) => {
  const app = express()
  app.all('/', (req, res) => res.json(stringify(req)))
  return app.listen(port)
}

describe('AxiosHttpClient', () => {
  const port = 9876
  const baseUrl = `http://127.0.0.1:${port}`
  const client = new AxiosHttpClient(baseUrl)
  let server

  before(async () => {
    server = await startPingServer(port)
  })

  after(async () => {
    await server.close()
  })

  describe('request', () => {
    it('should be able to send a GET request', async () => {
      const response = await client.request({
        method: 'GET',
        url: '/',
      })
      const data = JSON.parse(response.data)

      data.method.should.equal('GET')
      data.url.should.equal('/')
    })

    it('should be able to send a POST request', async () => {
      const response = await client.request({
        method: 'POST',
        url: '/',
        data: 'hello world'
      })
      const data = JSON.parse(response.data)

      data.method.should.equal('POST')
      data.url.should.equal('/')
    })
  })
})
