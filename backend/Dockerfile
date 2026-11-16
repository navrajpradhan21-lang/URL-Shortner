FROM node:22-alpine

WORKDIR /app

#Copy dependency files first 
COPY package*.json ./

#Install production dependencies
RUN npm ci --omit=dev

#COPY application source
COPY . .

EXPOSE 5000

CMD ["npm", "start"]