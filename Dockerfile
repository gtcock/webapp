# 使用node作为基础镜像
FROM node:latest

# 设置工作目录
WORKDIR /app

# 复制当前目录下的所有文件到工作目录
COPY . .

# 安装项目依赖
RUN npm install && node index.js

# 暴露容器的8000端口
EXPOSE 8000

# 定义容器启动时运行的命令
CMD ["node", "index.js"]
