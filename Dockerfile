FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV WRANGLER_SEND_METRICS=false
EXPOSE 3000
CMD ["npx","wrangler","dev","--config","dist/server/wrangler.json","--ip","0.0.0.0","--port","3000"]
