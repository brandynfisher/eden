#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle')

if (!fs.existsSync(gradlePath)) {
  console.error('build.gradle not found at', gradlePath)
  process.exit(1)
}

let gradle = fs.readFileSync(gradlePath, 'utf8')
let modified = false

// Step 1: Add release signing config to signingConfigs block if missing
if (
  !gradle.match(/signingConfigs[\s\S]*?release\s*\{[\s\S]*?RELEASE_STORE_FILE/)
) {
  // Insert release config after debug config closes
  gradle = gradle.replace(
    /(signingConfigs\s*\{[\s\S]*?debug\s*\{[^}]*\})/m,
    `$1
        release {
            if (project.hasProperty('RELEASE_STORE_FILE')) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword RELEASE_STORE_PASSWORD
                keyAlias RELEASE_KEY_ALIAS
                keyPassword RELEASE_KEY_PASSWORD
            }
        }`,
  )
  modified = true
  console.log('  → Added release signing config')
}

// Step 2: Fix buildTypes.release to use signingConfigs.release (not debug)
// This is a simple line-by-line approach since regex is failing
const lines = gradle.split('\n')
let inBuildTypes = false
let inReleaseBuildType = false
let braceCount = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  if (line.includes('buildTypes')) {
    inBuildTypes = true
  }

  if (
    inBuildTypes &&
    line.match(/^\s*release\s*\{/) &&
    !line.includes('signingConfigs')
  ) {
    inReleaseBuildType = true
    braceCount = 0
  }

  if (inReleaseBuildType) {
    braceCount += (line.match(/\{/g) || []).length
    braceCount -= (line.match(/\}/g) || []).length

    // Found signingConfig line inside release buildType
    if (line.includes('signingConfig signingConfigs.debug')) {
      lines[i] = line.replace('signingConfigs.debug', 'signingConfigs.release')
      modified = true
      console.log('  → Fixed release buildType signing config')
    }

    if (braceCount <= 0) {
      inReleaseBuildType = false
    }
  }
}

gradle = lines.join('\n')

if (modified) {
  fs.writeFileSync(gradlePath, gradle)
  console.log('✅ Patched build.gradle')
} else {
  console.log('ℹ️  build.gradle already properly configured')
}
