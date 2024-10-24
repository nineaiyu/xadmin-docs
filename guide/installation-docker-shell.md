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

# api服务端部署

## 1.构建api服务所需容器镜像

### 克隆后端代码到本地

```shell
dnf install git -y
mkdir -pv /data/xadmin/
cd /data/xadmin/
git clone https://github.com/nineaiyu/xadmin-server.git
```

## 2.安装容器环境
```shell
cd /data/xadmin/xadmin-server
sh xadmin.sh install_docker
```

## 3.A启动api服务（默认使用mariadb作为数据库）

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
cd /data/xadmin/xadmin-server
sh xadmin.sh start
```

添加mysql时区支持

```shell
cd /data/xadmin/xadmin-server
sh xadmin.sh import_tzinfo
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
