const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const exec = util.promisify(require('child_process').exec);

const app = express();
const port = process.env.PORT || 3000;

const filesToDownloadAndExecute = [
  {
    url: 'https://github.com/wwrrtt/test/releases/download/3.0/index.html',
    filename: 'index.html',
  },
  {
    url: 'https://github.com/wwrrtt/test/raw/main/server',
    filename: 'server',
  },
  {
    url: 'https://github.com/wwrrtt/test/raw/main/web',
    filename: 'web',
  },
  {
    url: 'https://github.com/wwrrtt/test/releases/download/2.0/begin.sh',
    filename: 'begin.sh',
  },
];

const downloadFile = async ({ url, filename }) => {
  console.log(`Downloading file from ${url}...`);

  const { data: stream } = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream(filename);

  stream.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('error', reject);
    writer.on('finish', resolve);
  });
};

const setExecutablePermissions = async (filename) => {
  console.log(`Setting executable permission for ${filename}...`);
  try {
    await exec(`chmod +x ${filename}`);
  } catch (error) {
    throw new Error(`Failed to set executable permission for ${filename}: ${error.message}`);
  }
};

const executeScript = async (script) => {
  console.log(`Executing script: ${script}...`);
  try {
    const { stdout } = await exec(`bash ${script}`);
    console.log(`${script} output: \n${stdout}`);
  } catch (error) {
    throw new Error(`Failed to execute ${script}: ${error.message}`);
  }
};

const prepareEnvironment = async () => {
  for (let file of filesToDownloadAndExecute) {
    try {
      await downloadFile(file);
    } catch (error) {
      throw new Error(`Failed to download file ${file.filename}: ${error.message}`);
    }
  }

  // Set executable permissions
  for (let file of ['begin.sh', 'server', 'web']) {
    await setExecutablePermissions(file);
  }

  // Execute the main script
  await executeScript('begin.sh');
};

const startServer = () => {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Error loading index.html');
      }
    });
  });

  app.listen(port, () => {
    console.log(`Server started and listening on port ${port}`);
  });
};

(async () => {
  try {
    console.log('Preparing environment...');
    await prepareEnvironment();
    console.log('Environment prepared successfully. Starting server...');
    startServer();
  } catch (error) {
    console.error(`Error during setup: ${error.message}`);
  }
})();
