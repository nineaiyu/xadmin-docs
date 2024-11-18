# 容器化安装部署

## xadmin-server 安装部署

xadmin-server 是基于Python环境开发，建议使用 ```Python3.12``` 进行安装部署

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

```shell
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
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

## [7.部署NGINX,并访问](../guide/installation-nginx)