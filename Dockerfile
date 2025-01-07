FROM node:12-alpine 
RUN apk add --no-cache python2 g++ make 
WORKDIR /app 
COPY . . 
RUN npm install --production 
CMD ["node", "app.js"] 
EXPOSE 8
