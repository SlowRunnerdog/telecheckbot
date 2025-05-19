FROM node:18

WORKDIR /app

# Copy package.json và package-lock.json trước để cache layer cài đặt dependencies
COPY package*.json ./

# Cài dependencies production (nếu bạn chỉ cần production)
RUN npm ci --omit=dev

# Copy toàn bộ source code vào container
COPY . .

# Nếu app của bạn chạy file index.js, giữ nguyên dòng dưới. Nếu không, sửa lại cho đúng file chính.
CMD ["node", "index.js"]