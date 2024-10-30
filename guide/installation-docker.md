# 容器化安装部署

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.12``` 进行安装部署

## 环境依赖

```
python >=3.12
nodejs >=20
redis >=6
mariadb > 10.5 或 mysql > 8.0
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

```shell
sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

##### 【可选】如果官方源，上面命令安装比较慢，可以使用下面命令，切换为清华源，然后再执行上面安装命令

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

## 3.A启动api服务（使用mariadb作为数据库） （3.A和3.B任选一个进行操作）

### 修改```config.py```

## SECRET_KEY: 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值

```shell
cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
```

将上面的命令生成的字符串填写到 ```SECRET_KEY``` 里面

```shell
# 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
# $ cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
SECRET_KEY = 'django-insecure-mlq6(#a^2vk!1=7=xhp#$i=o5d%namfs=+b26$m#sh_2rco7j^'
```
```shell
# mysql 数据库配置
# create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
# grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';
DB_ENGINE = 'django.db.backends.mysql'
DB_HOST = 'mariadb'
DB_PORT = 3306
DB_USER = 'server'
DB_DATABASE = 'xadmin'
DB_PASSWORD = 'KGzKjZpWBp4R4RSa'
DB_OPTIONS = {'init_command': 'SET sql_mode="STRICT_TRANS_TABLES"', 'charset': 'utf8mb4', 'collation': 'utf8mb4_bin'}

## sqlite3 配置，和 mysql配置 二选一, 默认mysql数据库
#DB_ENGINE = 'django.db.backends.sqlite3'
```

```shell
mkdir -pv /data/xadmin/xadmin-mariadb/{data,logs}
chown 1001.1001 -R /data/xadmin/xadmin-mariadb/{data,logs}
chown 1001.1001 -R /data/xadmin/xadmin-server/* # 为了安全考虑，容器使用非root用户启动服务
cd /data/xadmin/xadmin-server/
docker compose up -d  # -d 参数是后台运行，如果去掉，则前台运行
```

添加mysql时区支持

```shell
docker exec -it xadmin-mariadb sh -c 'mariadb-tzinfo-to-sql /usr/share/zoneinfo | mariadb -u root mysql'
```

## 3.B启动api服务（使用sqlite作为数据库，不推荐）

### 修改```config.py```

```shell
# mysql 数据库配置
# create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
# grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';
# DB_ENGINE = 'django.db.backends.mysql'
# DB_HOST = 'mariadb'
# DB_PORT = 3306
# DB_USER = 'server'
# DB_DATABASE = 'xadmin'
# DB_PASSWORD = 'KGzKjZpWBp4R4RSa'
# DB_OPTIONS = {'init_command': 'SET sql_mode="STRICT_TRANS_TABLES"', 'charset': 'utf8mb4', 'collation': 'utf8mb4_bin'}

## sqlite3 配置，和 mysql配置 二选一, 默认sqlite数据库
DB_ENGINE = 'django.db.backends.sqlite3'
```

```shell
cd /data/xadmin/xadmin-server/
docker compose -f docker-compose-sqlite.yml up -d  # -d 参数是后台运行，如果去掉，则前台运行
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

# 前端构建部署

## 5.克隆前端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-client.git
```

## 6.修改为自己服务器的域名信息，```/data/xadmin/xadmin-client/.env.production```

```shell
# api接口地址
VITE_API_DOMAIN="https://xadmin.dvcloud.xin"
# ws 接口地址，由于建立socket需要token授权，则需要保证前端域名和ws域名一致
VITE_WSS_DOMAIN="wss://xadmin.dvcloud.xin"
```

## 7.通过脚本进行容器化构建

```shell
cd /data/xadmin/xadmin-client
sh build.sh
```
