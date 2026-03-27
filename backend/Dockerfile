FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY backend/ml ./ml

RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/health.db
ENV UPLOAD_DIR=/app/data/uploads

EXPOSE 8080

CMD ["npm", "run", "start"]
