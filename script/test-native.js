#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const testsPath = path.resolve(__dirname, '..', 'build', 'Debug', 'tests')

if (fs.existsSync(testsPath)) {
  childProcess.spawnSync('node-gyp', ['build'], {stdio: 'inherit'})
} else {
  console.log('Building tests binary in debug configuration...')
  childProcess.spawnSync('node-gyp', ['rebuild', '--debug', '--tests'], {stdio: 'inherit'})
}

childProcess.spawnSync(testsPath, {stdio: 'inherit'})
