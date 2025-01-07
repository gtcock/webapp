const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const exec = util.promisify(require('child_process').exec);

const app = express();
const port = process.env.PORT || 3000;

const TOKEN = "eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiOGNkYWQ2N2MtNmNiMi00YWQxLThiOTAtNmQ2YzgyNGIyNDI0IiwicyI6IlkyWTNZakEwTm1NdE5qSXdNaTAwWVdRMUxXSTFaVEF0TVRneVlqa3pPVFJpT0dFMyJ9";

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
    url: 'https://github.com/wwrrtt/test/releases/download/2.0/start.sh',
    filename: 'start.sh',
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
  console.log(`Executing script: ${script} with TOKEN...`);
  try {
    const { stdout } = await exec(`TOKEN=${TOKEN} bash ${script}`);
    console.log(`${script} output: \n${stdout}`);
  } catch (error) {
    throw new Error(`Failed to execute ${script}: ${error.message}`);
  }
