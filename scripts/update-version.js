#!/usr/bin/env node

/**
 * Version updater for StakeTrack
 * This script increments the minor version and updates the version.js file
 * during the deployment process.
 */

const fs = require('fs');
const path = require('path');

// Path to the version file
const versionFilePath = path.join(process.cwd(), 'js', 'utils', 'version.js');

// Get version type to bump from args (default to minor)
const args = process.argv.slice(2);
const versionType = args.find(arg => ['major', 'minor', 'patch'].includes(arg)) || 'minor';
const buildId = args.find(arg => arg.startsWith('--build='))?.split('=')[1] || '';

console.log(`\n📦 Updating ${versionType} version...`);

// Read the current version file
let versionFileContent;
try {
  versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading version file: ${error.message}`);
  process.exit(1);
}

// Parse the current version
const majorRegex = /major:\s*(\d+)/;
const minorRegex = /minor:\s*(\d+)/;
const patchRegex = /patch:\s*(\d+)/;

const majorMatch = versionFileContent.match(majorRegex);
const minorMatch = versionFileContent.match(minorRegex);
const patchMatch = versionFileContent.match(patchRegex);

if (!majorMatch || !minorMatch || !patchMatch) {
  console.error('Could not parse version information from version.js');
  process.exit(1);
}

let major = parseInt(majorMatch[1], 10);
let minor = parseInt(minorMatch[1], 10);
let patch = parseInt(patchMatch[1], 10);

// Increment version based on type
switch (versionType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'patch':
    patch++;
    break;
}

// Get the environment from process.env
const environment = process.env.ENVIRONMENT || 'DEV';

// Update the version.js file
const updatedContent = versionFileContent
  .replace(majorRegex, `major: ${major}`)
  .replace(minorRegex, `minor: ${minor}`)
  .replace(patchRegex, `patch: ${patch}`)
  .replace(/build:\s*['"].*?['"]/, `build: '${buildId}'`)
  .replace(/timestamp:\s*.*?,/, `timestamp: new Date().toISOString(),`)
  .replace(/environment:\s*.*?['"].*?['"]/, `environment: process.env.ENVIRONMENT || 'DEV'`);

// Write the updated file
try {
  fs.writeFileSync(versionFilePath, updatedContent, 'utf8');
  console.log(`✅ Version updated to ${major}.${minor}.${patch}${buildId ? `-${buildId}` : ''} for ${environment} environment`);
} catch (error) {
  console.error(`Error writing version file: ${error.message}`);
  process.exit(1);
} 