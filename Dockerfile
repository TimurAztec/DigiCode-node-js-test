FROM node:16-alpine

WORKDIR /nest-mongo-directory-scanner
COPY . .
RUN npm install
CMD npm run start
