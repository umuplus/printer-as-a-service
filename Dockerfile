FROM node:8

WORKDIR /usr/src/app

COPY package*.json ./

# RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]
