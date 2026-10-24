# Optional isolated runner; network access to apt and npm is required at build/run time.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium python3 python3-pil ca-certificates fonts-liberation \
  libnss3 libatk-bridge2.0-0 libx11-xcb1 libasound2 libgbm1 \
  && rm -rf /var/lib/apt/lists/*
ENV UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE=/usr/bin/chromium
WORKDIR /workspace
COPY . .
RUN chmod +x sandbox/run-all-tests.sh
CMD ["bash","sandbox/run-all-tests.sh"]
