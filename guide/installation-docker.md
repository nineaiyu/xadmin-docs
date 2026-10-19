# 容器化安装部署

> 本文是**手工 compose 部署**（`git clone` + `docker compose`，自建目录、自己控版本）。
> 不想手工操作、要一键安装/升级/备份？用[安装器一键部署](./demo.md)（xadmin-installer）。
> 想先几分钟看效果？用[快速体验（一键启动）](./quick-start.md)（`ops/dev_up.sh`）。
>
> 本文步骤在 **CentOS 9 Stream** 上验证；其余 Linux 发行版把包管理命令换成对应的即可
> （Debian/Ubuntu 用 `apt`，见 [Windows/WSL 开发环境](../devguidelines/windows.md) 的依赖安装段）。

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.14``` 进行安装部署

## 环境依赖

```
python >=3.14
nodejs >=24（与客户端 package.json 的 engines 一致）
pnpm >=11
redis >=6
mariadb > 10.5 或 mysql > 8.0 | postgresql 17
```

> 上表为**最低要求**；官方镜像实际运行版本更高（如后端镜像 Python 3.14.x、前端构建镜像 Node 24.x），
> 以 `Dockerfile` / `Dockerfile-base` 与发布镜像为准。

## 支持的数据库

- PostgreSQL
- MariaDB
- MySQL
- Oracle
- SQLite

具体参考官方文档：https://docs.djangoproject.com/zh-hans/6.0/ref/databases/

## Centos 9 Stream 下 Docker 容器部署

### 部署流程总览

| 步骤 | 内容 | 小节 |
|------|------|------|
| 1 | 安装 Docker 与 compose 插件 | [一、安装 Docker](#一、安装-docker-已有-docker-可跳过) |
| 2 | 克隆后端代码 + 构建镜像 | [二、部署 api 服务端](#二、部署-api-服务端) |
| 3 | 修改配置（`config.yml` + `.env`） | 同上 |
| 4 | 启动后端容器 + 初始化数据 | 同上 |
| 5 | 部署前端（官方镜像 / 源码构建 / NGINX 三选一） | [三、前端部署](#三、前端部署) |

### docker 环境安装

官方文档： <https://docs.docker.com/get-docker/> ；
国内镜像源： <https://developer.aliyun.com/mirror/docker-ce>

## 一、安装 Docker（已有 Docker 可跳过）

参考 <https://docs.docker.com/engine/install/centos/> ：

```shell
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

```shell
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

#### 如果 docker-ce.repo 下载失败，可使用清华 docker-ce 源

```shell
tee /etc/yum.repos.d/docker-ce.repo <<'EOF'
[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/gpg

[docker-ce-stable-source]
name=Docker CE Stable - Sources
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/$basearch/source/stable
enabled=0
gpgcheck=1
gpgkey=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/gpg

[docker-ce-test]
name=Docker CE Test - $basearch
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/gpg

[docker-ce-test-source]
name=Docker CE Test - Sources
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/$basearch/source/test
enabled=0
gpgcheck=1
gpgkey=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/gpg

EOF

```

```shell
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

##### 【可选】如果使用官方源，上面命令安装比较慢，可以使用下面命令，切换为清华源，然后再执行上面安装命令

```shell
sed -i 's+https://download.docker.com+https://mirrors.tuna.tsinghua.edu.cn/docker-ce+' /etc/yum.repos.d/docker-ce.repo
```

```shell
sudo systemctl start docker
```

## 二、部署 api 服务端

### 1. 克隆后端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
cd xadmin-server
git checkout <目标版本 tag>   # 建议锁定版本（如 v5.0.2）；省略则用默认分支最新代码
```

### 2. 构建容器镜像

```shell
docker compose build
```

> ⚠️ 当 `pyproject.toml` / `uv.lock` 或 Python 版本有变动时，必须重新执行该命令；
> 仅代码逻辑变化（源码是挂载进容器的）不需要重新构建，但需要重启进程才生效。

### 3. 修改 server 配置文件

**3.1 应用配置 `config.yml`**（数据库 / Redis 连接与密钥的唯一定义处）：

```shell
cp config_example.yml config.yml
```

- a. 将 config.yml 里面的 `DB_PASSWORD`、`REDIS_PASSWORD` 取消注释并填值

```shell
sed -i "s@^#DB_PASSWORD:@DB_PASSWORD:@" config.yml
sed -i "s@^#REDIS_PASSWORD:@REDIS_PASSWORD:@" config.yml
```

- b. 生成并填写 `SECRET_KEY`（加密密钥；生产服必须保证唯一性与安全性，否则攻击者可以用它来生成自己的签名值）

```shell
sed -i "s@^SECRET_KEY.*@SECRET_KEY: $(cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49)@" config.yml
```

**3.2 compose 凭据 `.env`（必须，否则 `docker compose up` 直接报错拒启）**

`docker-compose.yml` 里 PostgreSQL / Redis 的密码是**强制注入**的（`:?DB_PASSWORD is required`），
compose 的变量插值读不了 YAML，所以除了 `config.yml` 还必须在同目录准备一份 `.env`
（`KEY=VALUE` 格式），两个密码值与 `config.yml` 保持一致：

```shell
cat > .env <<EOF
DB_PASSWORD=<与 config.yml 的 DB_PASSWORD 一致>
REDIS_PASSWORD=<与 config.yml 的 REDIS_PASSWORD 一致>
EOF
chmod 600 .env
```

> 说明：仓库内的 `ops/dev_up.sh` 会自动维护这份 `.env`（视为派生缓存，勿手工编辑）；
> 本节是**绕过脚本的手工部署**路径，所以需要自己创建。`.env` 已被 gitignore，不会被提交。

### 4. 启动 api 服务

```shell
cd /data/xadmin/xadmin-server/
docker compose up -d  # -d 参数是后台运行，如果去掉，则前台运行
```

### 5. 初始化数据：创建管理员 + 导入默认菜单/权限/角色等（仅新部署执行一次，幂等）

```shell
docker exec -it xadmin-server bash
```

```shell
python ops/init_data.py
# 幂等：自动完成 migrate + 创建超管 xadmin（随机密码仅打印一次）+ 导入默认菜单/权限/角色；可用 XADMIN_ADMIN_PASSWORD=xxx 指定初始密码
```

上面命令执行完成后，退出容器

```shell
exit
```

### 6. 验证后端

```shell
curl http://127.0.0.1:8896/api/common/api/health
# 期望 status / db_status / redis_status / storage_status 为 true（未起 worker 时 celery_status 为 false 属正常）
```

至此后端部署完成（API 文档：`/api-docs/swagger/`）。日常管理命令：

```bash
docker compose restart server celery-worker celery-heavy celery-beat   # 改代码/配置后重启（容器不热加载）
docker compose logs -f server                                          # 查看后端日志
docker compose down                                                    # 停止全部容器（数据卷保留）
```

## 三、前端部署

前端是纯静态产物（`xadmin-client` 构建出的 `dist/`），托管 + 反代三选一：

| 方式 | 适合场景 | 特点 |
|------|----------|------|
| 方式 A：官方 `xadmin-web` 镜像 | 推荐，与安装器一键部署同构 | 内置 CSP 安全头、`/media/` 鉴权内转，无需自写 nginx 配置 |
| 方式 B：本地构建 web 栈 | 需要修改 nginx 配置 / acme.sh 自动签发证书 | 栈文件在 `xadmin-installer/deploy/web/` |
| 方式 C：服务器自带 NGINX | 已有 nginx / 需要与其它站点共存 | 见 [NGINX 部署](./installation-nginx.md) |

### 7. 构建前端产物【方式 A / 方式 B 都需要】

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-client.git
cd xadmin-client
git checkout <目标版本 tag>   # 与后端 tag 保持一致

# Node >= 24 与 pnpm >= 11（nvm 安装见下）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 24
corepack enable pnpm

pnpm install --frozen-lockfile
pnpm build    # 产物在 dist/
```

不想装 Node 环境，也可以用容器构建（`build.sh` 内部即此原理）：

```shell
cd /data/xadmin/xadmin-client
docker run --rm -v ./:/app -e TZ=Asia/Shanghai \
    registry.cn-beijing.aliyuncs.com/nineaiyu/node:24.20.0-slim \
    sh -c "corepack enable && corepack prepare pnpm@11.25.0 --activate && pnpm install --frozen-lockfile && pnpm build"
```

### 8. 方式 A：官方 xadmin-web 镜像部署【步骤 8 / 9 / 10 任选其一】

官方镜像从 Docker Hub 拉取（`nineaiyu/xadmin-web`），镜像内 nginx 已内置 CSP 安全头、
`/media/` 鉴权转发与 `/_protected_media/` 内部直出位置；`web` 容器通过容器名 `server`
访问后端，因此必须与后端主栈在同一个 compose 网络里。

新建 `/data/xadmin/web/` 目录，创建 `docker-compose.yml`：

```yaml
services:
  xadmin-web:
    image: nineaiyu/xadmin-web:5.0.2        # 与后端版本保持一致
    container_name: xadmin-web
    restart: always
    environment:
      TZ: Asia/Shanghai
      HTTP_PORT: "80"                        # 对外监听端口（改端口需同时改 ports 映射）
      CLIENT_MAX_BODY_SIZE: 4096m            # 上传大小上限
    ports:
      - "80:80"
    volumes:
      # 前端构建产物（上一步 pnpm build 的 dist/）
      - /data/xadmin/xadmin-client/dist:/opt/xadmin-client:ro
      # 与后端共享媒体目录（/_protected_media 内部直出需要）
      - /data/xadmin/xadmin-server/data/upload:/data/xadmin/server/data/upload:ro
    networks:
      - xadmin-net

networks:
  xadmin-net:
    external: true
    name: xadmin-server_net                  # 后端主栈网络（docker-compose.yml 创建）
```

> 后端主栈的网络名是 `<compose 项目名>_net`；按上文路径部署（目录名 `xadmin-server`）
> 即为 `xadmin-server_net`，可用 `docker network ls` 确认。项目目录名不同时改 `name:` 即可。

启动并验证：

```shell
cd /data/xadmin/web/
docker compose up -d
curl -fsL http://127.0.0.1/ | head -5        # 应返回前端 index.html
curl -fsL http://127.0.0.1/api/common/api/health   # 经 web 反代访问后端健康检查
```

### 9. 方式 B：本地构建 web 栈（nginx 配置可改 + acme.sh 自动签发 HTTPS）【步骤 8 / 9 / 10 任选其一】

web 托管栈（nginx + API 反代 + TLS）原在 `xadmin-client` 仓库内，2026-09 起迁至
**`xadmin-installer` 仓库的 `deploy/web/` 目录**（部署资产不混入前端源码仓），
文件清单与细节见该目录的 [README](https://github.com/nineaiyu/xadmin-installer/blob/main/deploy/web/README.md)。

```shell
dnf install git -y
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-installer.git

cd /data/xadmin/xadmin-installer/deploy/web/

# 纯 HTTP（默认 80 端口，端口被占用时用 HTTP_PORT 换端口）：
DIST_DIR=/data/xadmin/xadmin-client/dist HTTP_PORT=8080 docker compose up -d --build

# HTTPS（acme.sh 自动签发 + 续签，需域名已解析到本机且 80/443 可达）：
DOMAIN=xadmin.example.com EMAIL=ops@example.com \
    DIST_DIR=/data/xadmin/xadmin-client/dist docker compose up -d --build
```

> ⚠️ 该栈的 nginx 把 `/api`、`/ws`、`/media`、`/flower`、`/api-docs` 反代到
> 容器名 `server`（后端主栈的 server 容器），需要加入后端网络才通：
> 在 `docker-compose.yml` 里把 `networks: default` 替换为后端主栈网络
> （external `xadmin-server_net`，写法同方式 A）；否则所有 API 请求会 502。
> letsencrypt 免费证书 7 天内同一域名最多签 5 次，测试时注意频率。

### 10. 部署 NGINX【步骤 8 / 9 / 10 任选一个】

使用服务器自带 NGINX 反向代理 + 静态托管时选此路
（含 `/media/` 鉴权内转、`X-Accel-Redirect` 受保护媒体等关键配置）：
见 [NGINX 部署](./installation-nginx.md)。

## 四、部署后检查清单

- [ ] `curl http://127.0.0.1:8896/api/common/api/health` 各项为 `true`；
- [ ] 浏览器访问前端地址，能用 `xadmin` + 初始化时打印的密码登录；
- [ ] 头像 / 附件等媒体资源能正常显示（`/media/` 走应用鉴权；用官方 web 镜像或
      按 [NGINX 部署](./installation-nginx.md) 配置了 `/_protected_media/` 内转的都无需额外操作）；
- [ ] 普通账号登录前，先在「角色管理」给角色授权菜单（权限码 `动作:组件名` 必须入库，见
      [权限体系速览](../advanced/permission.md)）；
- [ ] 用非默认端口（非 80/443）对外时，检查头像等媒体资源是否正常（见
      [常见问题 · 非标准端口媒体 404](../problem/one.md#_12-非-80-443-端口下-头像等图片文件资源不可用)）；
- [ ] 后续升级见[版本升级与回滚](./upgrade.md)。
