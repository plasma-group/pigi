const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const mkdirp = require('mkdirp')
const vyperjs = require('@pigi/vyper-js')

const walk = (dir) => {
  let files = []
  const objs = fs.readdirSync(dir)
  for (const obj of objs) {
    const file = path.join(dir, obj)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      files = files.concat(walk(file))
    } else {
      files.push(file)
    }
  }
  return files
}

const base = path.join(__dirname, 'src')
const source = path.join(base, 'contracts')
const dest = path.join(base, 'compiled')
const contracts = walk(source)

const getContractName = (contract) => {
  return path.basename(contract, path.extname(contract))
}

const createExportFile = (contract, compiled) => {
  const name = getContractName(contract)
  return `export const compiled${name} = ${JSON.stringify(compiled)}`
}

const createIndexFile = () => {
  return contracts.reduce((index, contract) => {
    const name = getContractName(contract)
    const relativePath = getRelativeContractPath(contract)
    return index + `export * from '${relativePath}/compiled${name}'\n`
  }, '')
}

const getRelativeContractPath = (contract) => {
  const relativePath = path.dirname(path.relative(source, contract))
  return relativePath.startsWith('.') ? relativePath : './' + relativePath
}

const getOutputFileName = (contract) => {
  const name = getContractName(contract)
  const relativePath = getRelativeContractPath(contract)
  return path.join(relativePath, `compiled${name}.ts`)
}

const createDirectory = (file) => {
  const dirname = path.dirname(file)
  if (fs.existsSync(dirname)) {
    return true
  }
  createDirectory(dirname)
  fs.mkdirSync(dirname)
}

contracts.forEach((contract) => {
  gulp.task(contract, async () => {
    mkdirp.sync(dest)
    const compiled = await vyperjs.compile(contract)
    const outputPath = path.join(dest, getOutputFileName(contract))
    createDirectory(outputPath)
    await fs.writeFileSync(outputPath, createExportFile(contract, compiled))
    await fs.writeFileSync(path.join(dest, 'index.ts'), createIndexFile())
  })
})

gulp.task('compile', gulp.series(contracts))
