# 容器化安装部署

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.13``` 进行安装部署

## 环境依赖

```
python >=3.12
nodejs >=22
redis >=6
mariadb > 10.5 或 mysql > 8.0 | postgresql 16
```

## 支持的数据库

- PostgreSQL
- MariaDB
- MySQL
- Oracle
- SQLite

具体参考官方文档：https://docs.djangoproject.com/zh-hans/5.0/ref/databases/

## Centos 9 Stream 下 Docker 容器部署

## docker环境安装官方文档： https://docs.docker.com/get-docker/

## 官网若无法正常下载docker，可参考国内docker-ce镜像源下载：https://developer.aliyun.com/mirror/docker-ce

## 1.环境安装 https://docs.docker.com/engine/install/centos/ (有docker环境可跳过)

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
#### 如果docker-ce.repo 下载失败，可使用清华docker-ce源
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
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/source/stable
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
baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/$releasever/source/test
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

# api服务端部署

## 2.构建api服务所需容器镜像

### 克隆后端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
```

### ⚠️（当requirements.txt）变动的时候，需要执行该构建命令

```shell
cd /data/xadmin/xadmin-server/
docker compose build
```

## 3.1 修改 server 配置文件

```shell
cp config_example.yml config.yml
```

- a.将config.yml里面的 DB_PASSWORD ， REDIS_PASSWORD 取消注释

```shell
sed -i "s@^#DB_PASSWORD:@DB_PASSWORD:@" config.yml
sed -i "s@^#REDIS_PASSWORD:@REDIS_PASSWORD:@" config.yml
```

- b.生成，并填写 SECRET_KEY， 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
```shell
sed -i "s@^SECRET_KEY.*@SECRET_KEY: $(cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49)@" config.yml
```

## 3.2 启动api服务

```shell
cd /data/xadmin/xadmin-server/
docker compose up -d  # -d 参数是后台运行，如果去掉，则前台运行
```

## 4.创建管理员用户，导入默认菜单，权限，角色等数据（仅新部署执行一次）

```shell
docker exec -it xadmin-server bash
```

```shell
python manage.py createsuperuser
```

```shell
python manage.py load_init_json
```
上面命令执行完成后，退出容器
```shell
exit
```

# 前端构建部署

## 5.克隆前端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-client.git
```

## 6.通过脚本进行容器化构建

```shell
cd /data/xadmin/xadmin-client
sh build.sh
```

## 7.使用容器启动前端服务【必须先启动server服务】【步骤7和8任选一个】

### 构建xadmin-web服务

```shell
cd /data/xadmin/xadmin-client/
docker compose build
```
### 启动xadmin-web服务, 默认是80端口，如果服务器存在该端口占用，请修改docker-compose.yml文件，将第一个80端口改为其他端口，或者使用服务器自带NGINX部署服务，参考下一步骤8
```shell
cd /data/xadmin/xadmin-client/
docker compose up -d
```

### 开启域名Https加密访问，使用acme.sh免费SSL证书【可选】

#### 前置条件
    - 有一个域名【使用国内服务器，域名必须备案】，有公网IP，并且域名已经解析到该服务器的公网IP
    - 该有公网的服务器无80，443端口监听

#### 修改文件 ```docker-compose.yml``` ，需要修改三个内容，参考如下三个注释

#### 如果要使用ssl，并且使用acme.sh自动申请证书，请取消注释，并将 xadmin.dvcloud.xin 填写自己的域名！！！
#### 如果要使用ssl，并且使用acme.sh自动申请证书，请取消注释，并将 xadmin@dvcloud.xin 填写自己的邮件！！！

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

注意：使用的letsencrypt免费证书服务，7天内，同一个域名可签5次
```shell
./web
├── acme.sh
│   ├── acme.sh
│   ├── deploy
│   └── notify
├── conf   # web配置，用于镜像构建
│   ├── nginx.conf
│   └── xadmin-api-conf
└── data   # 容器持久化目录，存放静态文件，证书，日志
    ├── .acme.sh  # acme.sh 安装路径
    ├── cert      # ssl证书，自动生成
    ├── dist      # xadmin-client 静态文件
    └── logs      # xadmin-web nginx服务日志

```

修改之后，启动服务，前台运行，查看输出是否正常，申请证书是否正常，测试访问是否正常
```shell
cd /data/xadmin/xadmin-client/
docker compose up 
```

如果正常，停止上面命令，请执行下面命令，放后台运行
```shell
cd /data/xadmin/xadmin-client/
docker compose up -d
```
上面完成后，请访问 https://域名 访问服务，如果正常，恭喜，安装成功，无需操作第8步

## [8.部署NGINX,并访问](../guide/installation-nginx) 【步骤7和8任选一个】