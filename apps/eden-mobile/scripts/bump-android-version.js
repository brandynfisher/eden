#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
const gradle = fs.readFileSync(gradlePath, 'utf8');

const match = gradle.match(/versionCode\s+(\d+)/);
if (!match) {
  console.error('versionCode not found in android/app/build.gradle');
  process.exit(1);
}

const current = parseInt(match[1], 10);
const next = current + 1;
const updated = gradle.replace(/versionCode\s+\d+/, `versionCode ${next}`);

fs.writeFileSync(gradlePath, updated);
console.log(`Bumped versionCode: ${current} -> ${next}`);
