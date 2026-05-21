# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
# Debian-based image: sharp/libvips with SVG text rendering via Pango is more
# stable on Debian's native libs than on Alpine, where bundled and system libs
# can collide once fontconfig is installed.
FROM node:24-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig \
    && rm -rf /var/lib/apt/lists/*

# package.json is required for "type": "module" resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.npmrc* ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/static/fonts ./static/fonts
COPY --from=builder /app/drizzle ./drizzle

RUN npm ci --omit=dev && npm cache clean --force

# sharp/libvips renders SVG text via Pango+Fontconfig, which ignores @font-face
# rules and only sees fonts registered with fontconfig. Register Barlow Condensed
# system-wide so the card overlay renders with the correct glyphs.
RUN mkdir -p /usr/local/share/fonts/woff2 \
    && cp ./static/fonts/*.woff2 /usr/local/share/fonts/woff2/ \
    && fc-cache -f

ENV NODE_ENV=production
ENV PORT=3000
# 2x MAX_UPLOAD_SIZE (10 MB each) plus multipart overhead
ENV BODY_SIZE_LIMIT=21000000

EXPOSE 3000

# @sveltejs/adapter-node reads the public origin from $ORIGIN. We expose it
# externally as $BASE_URL so it can do double duty later (OAuth callbacks,
# email links) under one name, and map it back to $ORIGIN here.
ENTRYPOINT ["/bin/sh", "-c", "if [ -n \"$BASE_URL\" ]; then export ORIGIN=\"$BASE_URL\"; fi; exec \"$@\"", "--"]
CMD ["node", "build/index.js"]
