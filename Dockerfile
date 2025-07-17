FROM node:18-slim
RUN npm install -g nodemon
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]
