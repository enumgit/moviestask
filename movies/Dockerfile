FROM node:14.15-alpine

RUN mkdir /myapp/
WORKDIR /myapp/

COPY ./package.json ./package-lock.json ./
RUN npm install

RUN mkdir ./src
COPY ./src ./src

CMD ["node", "./src/movies.js"]