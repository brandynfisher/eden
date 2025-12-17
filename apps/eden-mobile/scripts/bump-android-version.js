#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const versionFile = path.join(__dirname, '..', 'android-version.json')

// Read current version
let data = { versionCode: 0 }
if (fs.existsSync(versionFile)) {
  data = JSON.parse(fs.readFileSync(versionFile, 'utf8'))
}

// Check for --set flag to manually set version
const setArg = process.argv.find(arg => arg.startsWith('--set='))
if (setArg) {
  const newVersion = parseInt(setArg.split('=')[1], 10)
  if (isNaN(newVersion) || newVersion < 1) {
    console.error('Invalid version number. Use --set=<number>')
    process.exit(1)
  }
  data.versionCode = newVersion
  fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n')
  console.log(`Set versionCode to ${newVersion}`)
  process.exit(0)
}

// Check for --get flag to just print current version
if (process.argv.includes('--get')) {
  console.log(data.versionCode)
  process.exit(0)
}

// Default: bump version
const current = data.versionCode
const next = current + 1
data.versionCode = next
fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n')
console.log(`Bumped versionCode: ${current} -> ${next}`)
