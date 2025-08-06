const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const RUNTIME_DIR = path.join(__dirname, '..', 'runtime');
const BUN_RELEASES_URL = 'https://api.github.com/repos/oven-sh/bun/releases/latest';

function getPlatformInfo() {
  const platform = os.platform();
  const arch = os.arch();
  
  if (platform === 'win32') {
    return { platform: 'windows', arch: 'x64', ext: '.zip' };
  } else if (platform === 'darwin') {
    return { 
      platform: 'darwin', 
      arch: arch === 'arm64' ? 'aarch64' : 'x64',
      ext: '.zip'
    };
  } else if (platform === 'linux') {
    return { 
      platform: 'linux', 
      arch: arch === 'arm64' ? 'aarch64' : 'x64',
      ext: '.zip'
    };
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (error) => {
        fs.unlink(destination, () => {}); // Delete partial file
        reject(error);
      });
    }).on('error', reject);
  });
}

function extractZip(zipPath, extractTo) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractTo}'"`
      : `unzip -o "${zipPath}" -d "${extractTo}"`;
      
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Extraction failed: ${error.message}`));
        return;
      }
      resolve();
    });
  });
}

async function setupBun() {
  try {
    console.log('Setting up bundled Bun runtime...');
    
    // Ensure runtime directory exists
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    
    const platformInfo = getPlatformInfo();
    console.log(`Detected platform: ${platformInfo.platform}-${platformInfo.arch}`);
    
    // Fetch latest release info
    console.log('Fetching latest Bun release info...');
    const releaseInfo = await new Promise((resolve, reject) => {
      https.get(BUN_RELEASES_URL, { 
        headers: { 'User-Agent': 'App0-Setup' }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse release info'));
          }
        });
      }).on('error', reject);
    });
    
    // Find the appropriate asset
    const assetPattern = `bun-${platformInfo.platform}-${platformInfo.arch}${platformInfo.ext}`;
    const asset = releaseInfo.assets.find(asset => asset.name.includes(assetPattern));
    
    if (!asset) {
      throw new Error(`No suitable Bun binary found for ${assetPattern}`);
    }
    
    console.log(`Found Bun binary: ${asset.name}`);
    
    // Download the binary
    const downloadPath = path.join(RUNTIME_DIR, asset.name);
    console.log('Downloading Bun binary...');
    await downloadFile(asset.browser_download_url, downloadPath);
    
    // Extract the binary
    console.log('Extracting Bun binary...');
    await extractZip(downloadPath, RUNTIME_DIR);
    
    // Find the extracted binary and rename it
    const extractedDir = path.join(RUNTIME_DIR, path.basename(asset.name, platformInfo.ext));
    const bunBinary = process.platform === 'win32' ? 'bun.exe' : 'bun';
    const sourceBinary = path.join(extractedDir, bunBinary);
    const targetBinary = path.join(RUNTIME_DIR, bunBinary);
    
    if (fs.existsSync(sourceBinary)) {
      fs.copyFileSync(sourceBinary, targetBinary);
      
      // Make executable on Unix systems
      if (process.platform !== 'win32') {
        fs.chmodSync(targetBinary, 0o755);
      }
      
      // Clean up
      fs.unlinkSync(downloadPath);
      fs.rmSync(extractedDir, { recursive: true, force: true });
      
      console.log(`✓ Bun runtime successfully set up at: ${targetBinary}`);
    } else {
      throw new Error('Extracted binary not found');
    }
    
  } catch (error) {
    console.error('✗ Failed to setup Bun runtime:', error.message);
    process.exit(1);
  }
}

// Create a simple fallback script for when bun is not available
function createFallbackScript() {
  const fallbackContent = `#!/usr/bin/env node
console.error('Bun runtime not available. Please install Node.js and npm to run generated apps.');
console.error('Alternatively, run the setup-bun script to download a bundled Bun runtime.');
process.exit(1);
`;
  
  const fallbackPath = path.join(RUNTIME_DIR, process.platform === 'win32' ? 'bun.cmd' : 'bun');
  fs.writeFileSync(fallbackPath, fallbackContent);
  
  if (process.platform !== 'win32') {
    fs.chmodSync(fallbackPath, 0o755);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupBun().catch(() => {
    console.log('Creating fallback script...');
    createFallbackScript();
  });
}

module.exports = { setupBun, createFallbackScript };