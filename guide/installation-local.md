# 本地安装部署

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.12``` 进行安装部署

## 环境依赖

```
python >=3.12
nodejs >=20
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

## Centos 9 Stream 下本地直接安装部署

## 1.Python环境安装

```shell
dnf install python3.12 python3.12-devel -y
```

## 2.1安装postgresql依赖环境  [mysql和postgresql 二选一，默认postgresql]
```shell
dnf module switch-to postgresql:16
dnf install postgresql-server -y
postgresql-setup --initdb
systemctl enable postgresql
echo -e '\n127.0.0.1 postgresql' >> /etc/hosts   # 用于添加postgresql本地解析
```

修改配置，支持md5密码认证 ```/var/lib/pgsql/data/pg_hba.conf```

```shell
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

重启服务

```shell
systemctl restart postgresql
```

创建数据库并添加授权

```shell
su postgres 
psql -c "create database xadmin;"
psql -c "CREATE USER server WITH PASSWORD 'KGzKjZpWBp4R4RSa';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE xadmin TO server;"
```

## 2.2 安装MySQL-client依赖环境，参考 mariadb 安装文档

## 3.安装启动Redis，并设置所需密码和hosts解析

```shell
dnf install redis -y
echo -e '\nrequirepass nineven' >> /etc/redis/redis.conf   # 用于添加redis密码
echo -e '\n127.0.0.1 redis' >> /etc/hosts   # 用于添加redis本地解析
systemctl enable redis
systemctl restart redis
```

## 4.创建虚拟环境

```shell
mkdir -pv /data/xadmin/
cd /data/xadmin/
python3.12 -m venv py312
```

## 5.克隆后端代码到本地

```shell
dnf install git -y
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
```

## 6.安装依赖包

```shell
source /data/xadmin/py312/bin/activate
pip install --upgrade pip
cd /data/xadmin/xadmin-server
pip install -r requirements.txt
```

## 7.0 修改 server 配置文件

```shell
cp config_example.yml config.yml
```

- a.将config.yml里面的 DB_PASSWORD ， REDIS_PASSWORD 取消注释
- b.生成，并填写 SECRET_KEY， 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值

```shell
cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
```

将上面的命令生成的字符串填写到config.yml里面的 ```SECRET_KEY``` 配置项

```shell
# 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
# $ cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
SECRET_KEY: django-insecure-mlq6(#a^2vk!1=7=xhp#$i=o5d%namfs=+b26$m#sh_2rco7j^
```

## 7.1 生成数据表并迁移

```shell
python manage.py makemigrations
python manage.py migrate
```
## 7.2 收集静态资源，编译国际化，下载IP数据库
```shell
python manage.py collectstatic
python manage.py compilemessages
python manage.py download_ip_db -f
```

## 8.创建超级管理员(操作之前必须配置好Redis和数据库)

```shell
python manage.py createsuperuser
```

## 9.导入默认菜单，权限，角色等数据（仅新部署执行一次）

```shell
python manage.py load_init_json
```

## 10.启动程序(启动之前必须配置好Redis和数据库)

### A.一键执行命令【不支持windows平台，如果是Windows，请使用 手动执行命令】
```shell
python manage.py start all -d  # -d 参数是后台运行，如果去掉，则前台运行
```

### B.手动执行命令【下面命令一般是开发阶段操作】

#### 1.api服务

```shell
python manage.py runserver 0.0.0.0:8896
```

#### 2.定时任务

```shell
python -m celery -A server beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler --max-interval 60
python -m celery -A server worker -P threads -l INFO -c 10 -Q celery --heartbeat-interval 10 -n celery@%h --without-mingle
```

#### 3.任务监控，在windows无需执行，因为Windows平台无法正常运行

```shell
python -m celery -A server flower -logging=info --url_prefix=api/flower --auto_refresh=False  --address=0.0.0.0 --port=5566
```

# 前端构建部署

## 11.克隆前端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-client.git
```

## 12. 通过官网安装22版本的node环境
```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
source ~/.bashrc
node -v # layouts.download.codeBox.shouldPrint
npm -v # layouts.download.codeBox.shouldPrint
npm install -g pnpm
```

## 13.修改为自己服务器的域名信息，```/data/xadmin/xadmin-client/.env.production```

如果前端和后端域名是同一个，则下面可以不进行配置
```shell
# api接口地址
VITE_API_DOMAIN="https://xadmin.dvcloud.xin"
# ws 接口地址，由于建立socket需要token授权，则需要保证前端域名和ws域名一致
VITE_WSS_DOMAIN="wss://xadmin.dvcloud.xin"
```

## 14.编译安装

```shell
cd /data/xadmin/xadmin-client
pnpm install --frozen-lockfile
pnpm build
```