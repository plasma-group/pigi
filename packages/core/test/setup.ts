/* External Imports */
import fs = require('fs')
import path = require('path')
import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')

/* Internal Imports */
import { rootPath } from '../index'

import { solidity } from 'ethereum-waffle'

chai.use(chaiAsPromised)
const should = chai.should()

const testArtifactsDir = path.join(rootPath, 'test', 'artifacts.test.tmp')
const testRootPath = path.join(testArtifactsDir, (+new Date()).toString())
const dbRootPath = path.join(testRootPath, 'db')

// If these directories don't exist, create them.
fs.mkdirSync(testArtifactsDir, { recursive: true })
fs.mkdirSync(testRootPath, { recursive: true })
fs.mkdirSync(dbRootPath, { recursive: true })

export { should, dbRootPath }
export { testRootPath as rootPath }
