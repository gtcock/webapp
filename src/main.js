import { Client } from 'node-appwrite';
import axios from 'axios';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// 文件列表保持不变
const filesToDownloadAndExecute = [
  {
    url: 'https://github.com/gtcock/demo/releases/download/cock/index.html',
    filename: 'index.html',
  },
  {
    url: 'https://github.com/gtcock/demo/releases/download/cock/server',
    filename: 'server',
  },
  {
    url: 'https://github.com/gtcock/demo/releases/download/cock/web',
    filename: 'web',
  },
  {
    url: 'https://github.com/gtcock/demo/releases/download/cock/bot',
    filename: 'swith',
  },
  {
    url: 'https://raw.githubusercontent.com/gtcock/demo/refs/heads/appwrite/bingo.sh',
    filename: 'bingo.sh',
  },
  {
    url: 'https://github.com/gtcock/demo/releases/download/cock/config.json',
    filename: 'config.json',
  }
];

// 下载单个文件的函数
const downloadFile = async ({ url, filename }, log) => {
  log(`开始下载: ${filename}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  await fs.writeFile(filename, response.data);
  log(`${filename} 下载完成`);
};

// 设置权限的函数
const setPermissions = async (log) => {
  log('设置执行权限...');
  await exec('chmod +x bingo.sh');
  await exec('chmod +x server');
  await exec('chmod +x web');
  await exec('chmod +x swith');
  log('执行权限设置完成');
};

// 执行脚本的函数
const runStartScript = async (log) => {
  log('执行bingo.sh脚本...');
  const { stdout } = await exec('./bingo.sh');
  log('bingo.sh输出: ' + stdout);
  log('bingo.sh执行完成');
  return stdout;
};

// 主函数
export default async ({ req, res, log, error }) => {
  try {
    // 1. 下载所有文件
    log('开始下载所有文件...');
    for (const file of filesToDownloadAndExecute) {
      await downloadFile(file, log);
    }
    log('所有文件下载完成');

    // 2. 设置执行权限
    await setPermissions(log);

    // 3. 执行脚本
    const scriptOutput = await runStartScript(log);

    // 4. 返回结果
    if (req.path === '/') {
      try {
        const indexContent = await fs.readFile('index.html', 'utf8');
        return res.send(indexContent, 200, { 'Content-Type': 'text/html' });
      } catch (err) {
        error('读取index.html失败: ' + err.message);
        return res.json({
          success: true,
          message: '程序执行成功，但无法读取index.html',
          output: scriptOutput
        });
      }
    }

    return res.json({
      success: true,
      message: '程序执行成功',
      output: scriptOutput
    });

  } catch (err) {
    error('执行过程中出错: ' + err.message);
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
