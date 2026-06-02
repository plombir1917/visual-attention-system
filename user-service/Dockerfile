# стейдж билда
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Защита от запекания Git LFS-указателей вместо реальных дистрибутивов:
# если `git lfs pull` не отработал на хосте, в контекст попадают ~130-байтные
# текстовые указатели — лендинг тогда отдаёт битые архивы. Падаем явно здесь.
RUN for f in src/frontend/public/*.zip src/frontend/public/*.exe src/frontend/public/*.AppImage; do \
      [ -e "$f" ] || continue; \
      if head -c 64 "$f" | grep -q "git-lfs.github.com"; then \
        echo "ERROR: $f — это указатель Git LFS, а не файл. Выполните 'git lfs pull' перед сборкой." >&2; \
        exit 1; \
      fi; \
    done

RUN npm run generate
RUN npm run build

# стейдж прода
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# скомпилированные файлы и необходимые ресурсы
COPY --from=builder /app/dist ./dist

# статика для фронтенда и админки
COPY --from=builder /app/src/frontend/public ./dist/src/frontend/public
COPY --from=builder /app/src/admin/components/ ./src/admin/components/

# копируем папку prisma, т.к. файл со схемой не компилируется и генерируем клиент
COPY --from=builder /app/prisma/ ./prisma
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]