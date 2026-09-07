# 모노레포 루트를 컨텍스트로 빌드한다:
#   docker build -f apps/api/Dockerfile -t lastly-api .

FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# 의존성 목록만 먼저 복사해 캐시를 살린다. 소스가 바뀌어도 install을 다시 하지 않는다.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @lastly/api...

COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
# '...' 를 붙여 의존 패키지(contracts)까지 함께 빌드한다.
# contracts는 런타임 값(zod 스키마)이라 dist가 없으면 api가 실행 시 죽는다.
RUN pnpm --filter @lastly/api... build

# 실행에 필요 없는 개발 의존성을 덜어낸다.
RUN pnpm prune --prod


FROM node:20-slim AS runner

WORKDIR /repo
ENV NODE_ENV=production

# 루트 권한으로 돌리지 않는다.
USER node

COPY --from=builder --chown=node:node /repo/node_modules ./node_modules
COPY --from=builder --chown=node:node /repo/packages ./packages
COPY --from=builder --chown=node:node /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /repo/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /repo/apps/api/package.json ./apps/api/

# 호스팅 서비스가 PORT를 주입한다. 값이 없을 때만 4000을 쓴다.
ENV PORT=4000
EXPOSE 4000

CMD ["node", "apps/api/dist/main"]
