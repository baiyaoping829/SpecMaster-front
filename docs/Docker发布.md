# Docker 镜像构建与发布

## 本地构建（提交到本机 Docker 镜像仓库）

后端：

```bash
docker build -f docker/api/Dockerfile -t specmaster-api:local .
```

前端：

```bash
docker build -f docker/frontend/Dockerfile -t specmaster-frontend:local .
```

## 本地运行（前后端分离）

```bash
docker compose -f docker-compose.prod.yml up -d
```

- 前端：http://localhost:8080
- 后端：http://localhost:3001/api/health

## 推送到 DockerHub

示例（将 `<DOCKERHUB_USER>` 替换为你的 DockerHub 用户名或组织名）：

```bash
docker tag specmaster-api:local <DOCKERHUB_USER>/specmaster-api:v0.2.0
docker tag specmaster-api:local <DOCKERHUB_USER>/specmaster-api:latest
docker push <DOCKERHUB_USER>/specmaster-api:v0.2.0
docker push <DOCKERHUB_USER>/specmaster-api:latest

docker tag specmaster-frontend:local <DOCKERHUB_USER>/specmaster-frontend:v0.2.0
docker tag specmaster-frontend:local <DOCKERHUB_USER>/specmaster-frontend:latest
docker push <DOCKERHUB_USER>/specmaster-frontend:v0.2.0
docker push <DOCKERHUB_USER>/specmaster-frontend:latest
```

前端 nginx 会将 `/api/*` 反代到容器网络内的 `specmaster-api:3001`（见 docker/frontend/nginx.conf）。

