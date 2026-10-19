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
| 3 | 修改配置（数据库口令 / Redis 口令 / `SECRET_KEY`） | 同上 |
| 4 | 启动后端容器 + 初始化数据 | 同上 |
| 5 | 构建并启动前端（容器或 NGINX 二选一） | [三、前端构建部署](#三、前端构建部署) |

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
git checkout <目标版本 tag>   # 建议锁定版本（如 v5.0.1）；省略则用默认分支最新代码
```

### 2. 构建容器镜像

```shell
docker compose build
```

> ⚠️ 当 `pyproject.toml` / `uv.lock` 或 Python 版本有变动时，必须重新执行该命令；
> 仅代码逻辑变化（源码是挂载进容器的）不需要重新构建，但需要重启进程才生效。

### 3. 修改 server 配置文件

```shell
cp config_example.yml config.yml
```

- a. 将 config.yml 里面的 `DB_PASSWORD`、`REDIS_PASSWORD` 取消注释

```shell
sed -i "s@^#DB_PASSWORD:@DB_PASSWORD:@" config.yml
sed -i "s@^#REDIS_PASSWORD:@REDIS_PASSWORD:@" config.yml
```

- b. 生成并填写 `SECRET_KEY`（加密密钥；生产服必须保证唯一性与安全性，否则攻击者可以用它来生成自己的签名值）

```shell
sed -i "s@^SECRET_KEY.*@SECRET_KEY: $(cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49)@" config.yml
```

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

## 三、前端构建部署

### 7. 克隆前端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-client.git
```

### 8. 通过脚本进行容器化构建

```shell
cd /data/xadmin/xadmin-client
sh build.sh    # 内部使用 docker run -it 构建，需在交互式终端执行（CI / 管道环境会报 the input device is not a TTY）
```

### 9. 使用容器启动前端服务【必须先启动 server 服务】【步骤 9 和 10 任选一个】

#### 构建 xadmin-web 服务

```shell
cd /data/xadmin/xadmin-client/
docker compose build
```

#### 启动 xadmin-web 服务

默认是 80 端口，如果服务器存在该端口占用，请修改 `docker-compose.yml` 文件，将第一个 80 端口改为其他端口，或者使用服务器自带 NGINX 部署服务，参考下一步骤 10。

```shell
cd /data/xadmin/xadmin-client/
docker compose up -d
```

#### 开启域名 Https 加密访问，使用 acme.sh 免费 SSL 证书【可选】

##### 前置条件

- 有一个域名【使用国内服务器，域名必须备案】，有公网 IP，并且域名已经解析到该服务器的公网 IP；
- 该有公网的服务器无 80、443 端口监听。

##### 修改文件 `docker-compose.yml`，需要修改三个内容，参考如下三个注释

```shell
services:
  nginx-web:
    image: xadmin-web
    container_name: xadmin-web
    hostname: xadmin-web
    build:
      context: .
      dockerfile: Dockerfile-web
    restart: always
    environment:
      TZ: ${TZ:-Asia/Shanghai}
#      DOMAIN: ${DOMAIN:-xadmin.dvcloud.xin}  # 如果要使用ssl，并且使用acme.sh自动申请证书，请取消注释，并将 xadmin.dvcloud.xin 填写自己的域名！！！
#      EMAIL: ${EMAIL:-xadmin@dvcloud.xin}   # 如果要使用ssl，并且使用acme.sh自动申请证书，请取消注释，并将 xadmin@dvcloud.xin 填写自己的邮件！！！
    volumes:
      - ./web/acme.sh:/web/acme.sh
      - ./web/data/dist:/web/dist
      - ./web/data/.acme.sh:/root/.acme.sh
      - ./web/data/cert:/web/cert
      - ./web/data/logs:/var/log/nginx
    ports:
#      - "443:443"  # 如果要使用ssl，请取消注释
      - "80:80"
    networks:
      - net
```

注意：使用的 letsencrypt 免费证书服务，7 天内，同一个域名可签 5 次。

```shell
./web
├── acme.sh
│   ├── acme.sh
│   ├── deploy
│   └── notify
├── conf   # web配置，用于镜像构建
│   ├── nginx.conf
│   └── xadmin-api-conf
└── data   # 容器持久化目录，存放静态文件，证书，日志
    ├── .acme.sh  # acme.sh 安装路径
    ├── cert      # ssl证书，自动生成
    ├── dist      # xadmin-client 静态文件
    └── logs      # xadmin-web nginx服务日志

```

修改之后，启动服务，前台运行，查看输出是否正常，申请证书是否正常，测试访问是否正常：

```shell
cd /data/xadmin/xadmin-client/
docker compose up
```

如果正常，停止上面命令，请执行下面命令，放后台运行：

```shell
cd /data/xadmin/xadmin-client/
docker compose up -d
```

上面完成后，请访问 `https://域名` 访问服务，如果正常，恭喜，安装成功，无需操作第 10 步。

### 10. 部署 NGINX，并访问【步骤 9 和 10 任选一个】

见 [NGINX 部署](./installation-nginx.md)：使用服务器自带 NGINX 反向代理 + 静态托管时选此路
（含 `/media/` 鉴权内转、`X-Accel-Redirect` 受保护媒体等关键配置）。

## 四、部署后检查清单

- [ ] `curl http://127.0.0.1:8896/api/common/api/health` 各项为 `true`；
- [ ] 浏览器访问前端地址，能用 `xadmin` + 初始化时打印的密码登录；
- [ ] 普通账号登录前，先在「角色管理」给角色授权菜单（权限码 `动作:组件名` 必须入库，见
      [权限体系速览](../advanced/permission.md)）；
- [ ] 用非默认端口（非 80/443）对外时，检查头像等媒体资源是否正常（见
      [常见问题 · 非标准端口媒体 404](../problem/one.md#_12-非-80-443-端口下-头像等图片文件资源不可用)）；
- [ ] 后续升级见[版本升级与回滚](./upgrade.md)。
