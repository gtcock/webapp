# 使用node基础镜像
FROM node:latest

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# 设置工作目录权限
RUN apt-get update && \
    chmod -R 777 /app

# 安装依赖库
RUN npm install

# 暴露应用程序运行的端口
EXPOSE 8000

# 设置容器启动时运行的命令
CMD ["node", "index.js"]
