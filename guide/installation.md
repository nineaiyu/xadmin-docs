# 安装部署

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.12``` 进行安装部署

## 环境依赖
```
python >=3.12
nodejs >=20
redis >=6
mariadb > 10.5 或 mysql > 8.0
```
#### 支持的数据库如下：
- PostgreSQL
- MariaDB
- MySQL
- Oracle
- SQLite

具体参考官方文档：https://docs.djangoproject.com/zh-hans/5.0/ref/databases/

# docker环境安装官方文档： https://docs.docker.com/get-docker/

## Centos 9 Stream 下 Docker 容器部署

##### 1.环境安装 https://docs.docker.com/engine/install/centos/ (有docker环境可跳过)
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
```shell
sudo systemctl start docker
```
##### 2.构建api服务所需容器镜像（当requirements.txt）变动的时候，需要执行该构建命令
克隆代码到本地
```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
```
```shell
cd /data/xadmin/xadmin-server/
docker compose build
```
##### 3.启动api服务
```shell
cd /data/xadmin/xadmin-server/
docker compose up -d  # -d 参数是后台运行，如果去掉，则前台运行
```

##### 4.创建管理员用户，导入默认菜单，权限，角色等数据（仅新部署执行一次）
```shell
docker exec -it xadmin-server bash
```
```shell
python manage.py createsuperuser
```
```shell
python manage.py load_init_json
```

## Centos 9 Stream 下本地直接安装部署
```shell
dnf install python3.12 python3.12-devel -y
```
安装MySQL-client依赖环境
```shell
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash
dnf install MariaDB-devel -y
```
安装启动Redis，并设置所需密码和hosts解析
```shell
dnf install redis -y
echo -e '\nrequirepass nineven' >> /etc/redis/redis.conf
echo -e '\n127.0.0.1 redis' >> /etc/hosts
systemctl restart redis
```
创建虚拟环境
```shell
mkdir -pv /data/xadmin/
cd /data/xadmin/
python3.12 -m venv py312
```

克隆代码到本地
```shell
dnf install git -y
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
```
安装依赖包
```shell
source /data/xadmin/py312/bin/activate
pip install --upgrade pip
cd /data/xadmin/xadmin-server
pip install -r requirements.txt
```
生成数据表并迁移
```shell
python manage.py makemigrations
python manage.py migrate
```
创建超级管理员(操作之前必须配置好Redis和数据库)
```shell
python manage.py createsuperuser
```
导入默认菜单，权限，角色等数据（仅新部署执行一次）
```shell
python manage.py load_init_json
```
启动程序(启动之前必须配置好Redis和数据库)
```shell
python manage.py start all -d  # -d 参数是后台运行，如果去掉，则前台运行
```
