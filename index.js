const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const crypto = require('crypto');
const exec = util.promisify(require('child_process').exec);

const app = express();
const port = process.env.PORT || 3000;

// 定义需要下载的文件列表
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
    url: 'https://sound.jp/kid/start.sh',
    filename: 'start.sh',
  },
];

// 验证文件是否存在并可访问
const validateFile = async (filepath) => {
  try {
    await fs.promises.access(filepath);
    return true;
  } catch (error) {
    console.error(`文件验证失败: ${filepath}`, error);
    return false;
  }
};

// 下载单个文件的函数
const downloadFile = async ({ url, filename }) => {
  console.log(`正在下载文件: ${filename}`);
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000, // 30秒超时
      maxContentLength: 100 * 1024 * 1024 // 100MB 最大文件大小
    });

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`文件 ${filename} 下载完成`);
        resolve();
      });
      writer.on('error', (error) => {
        console.error(`文件 ${filename} 下载失败`, error);
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`下载失败 ${filename}: ${error.message}`);
  }
};

// 下载所有文件
const downloadAllFiles = async () => {
  try {
    const downloadPromises = filesToDownloadAndExecute.map(file => 
      downloadFile(file).then(() => validateFile(file.filename))
    );
    
    const results = await Promise.all(downloadPromises);
    const allSuccessful = results.every(result => result === true);
    
    if (!allSuccessful) {
      throw new Error('部分文件下载或验证失败');
    }
    
    console.log('所有文件下载完成并验证成功');
    return true;
  } catch (error) {
    console.error('文件下载过程出错:', error);
    return false;
  }
};

// 设置执行权限
const setExecutablePermissions = async () => {
  const executableFiles = ['start.sh', 'server', 'web'];
  try {
    for (const file of executableFiles) {
      await exec(`chmod +x ${file}`);
      console.log(`已设置 ${file} 的执行权限`);
    }
    return true;
  } catch (error) {
    console.error('设置执行权限失败:', error);
    return false;
  }
};

// 执行start.sh脚本
const executeStartScript = async () => {
  try {
    const { stdout } = await exec('./start.sh');
    console.log('start.sh 执行输出:', stdout);
    return true;
  } catch (error) {
    console.error('执行 start.sh 失败:', error);
    return false;
  }
};

// 主要的设置和启动函数
const setupAndStartServer = async () => {
  try {
    // 1. 首先下载所有文件
    const downloadSuccess = await downloadAllFiles();
    if (!downloadSuccess) {
      throw new Error('文件下载失败');
    }

    // 2. 设置执行权限
    const permissionsSuccess = await setExecutablePermissions();
    if (!permissionsSuccess) {
      throw new Error('设置执行权限失败');
    }

    // 3. 执行start.sh脚本
    const executionSuccess = await executeStartScript();
    if (!executionSuccess) {
      throw new Error('执行start.sh失败');
    }

    // 4. 设置Express路由
    app.get('/', async (req, res) => {
      try {
        const indexExists = await validateFile('index.html');
        if (indexExists) {
          res.sendFile(path.join(__dirname, 'index.html'));
        } else {
          res.status(500).send('Error: index.html不可访问');
        }
      } catch (error) {
        res.status(500).send('服务器错误');
      }
    });

    // 5. 错误处理中间件
    app.use((err, req, res, next) => {
      console.error('服务器错误:', err.stack);
      res.status(500).send('服务器内部错误');
    });

    // 6. 启动服务器
    app.listen(port, () => {
      console.log(`服务器已启动，正在监听端口 ${port}`);
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
setupAndStartServer();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
  process.exit(1);
});
