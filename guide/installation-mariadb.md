# MariaDB本地安装部署(可选)
---

### 可支持的数据库具体参考官方文档：https://docs.djangoproject.com/zh-hans/5.0/ref/databases/

## 1.安装MariaDB安装部署(可选)

```shell
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash
dnf install MariaDB-server MariaDB-client MariaDB-common MariaDB-devel -y
```

本次安装仅是为了演示，若生产服务器使用，则需要根据自己需求进行数据库目录更改，配置等优化

## 本人使用的数据库```/etc/my.cnf.d/server.cnf```配置
```shell
#
# These groups are read by MariaDB server.
# Use it for options that only the server (but not clients) should see
#

# this is read by the standalone daemon and embedded servers
[server]

# This group is only read by MariaDB servers, not by MySQL.
# If you use the same .cnf file for MySQL and MariaDB,
# you can put MariaDB-only options here
[mariadb]

# This group is read by both MariaDB and MySQL servers
[mysqld]
binlog_cache_size = 192K
thread_stack = 384K
join_buffer_size = 4096K
query_cache_type = 1
max_heap_table_size = 1024M

port		= 3306
socket		= /var/lib/mysql/mysql.sock
pid-file=/run/mariadb.pid
datadir = /data/mysql

default_storage_engine = InnoDB
performance_schema_max_table_instances = 400
table_definition_cache = 400
skip-external-locking
key_buffer_size = 512M
max_allowed_packet = 1G
table_open_cache = 1024
sort_buffer_size = 2048K
net_buffer_length = 4K
read_buffer_size = 2048K
read_rnd_buffer_size = 1024K
myisam_sort_buffer_size = 16M
thread_cache_size = 192
query_cache_size = 256M
tmp_table_size = 1024M
sql-mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES


max_connections = 6000
max_connect_errors = 100
open_files_limit = 65535


character-set-server=utf8
skip-name-resolve
event_scheduler=1
#skip-grant-tables


innodb_data_home_dir = /data/mysql/
innodb_data_file_path = ibdata1:10M:autoextend
innodb_log_group_home_dir = /data/mysql/
innodb_buffer_pool_size = 2048M
innodb_log_file_size = 128M
innodb_log_buffer_size = 32M
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
innodb_max_dirty_pages_pct = 90
innodb_read_io_threads = 4
innodb_write_io_threads = 4


plugin_load_add=server_audit
server_audit_logging=on
server_audit_events=connect,query
server_audit=force_plus_permanent
server_audit_events=QUERY_DDL,QUERY_DML,CONNECT
server_audit_output_type=file
server_audit_file_rotate_now=on
server_audit_file_rotations=10
server_audit_file_rotate_size=1G
server_audit_file_path=/data/logs/mysql


log_error=/data/logs/mysql/mysql.err

log_output=FILE
slow_query_log
long_query_time=3
slow_query_log_file=/data/logs/mysql/mysql-slow.log
log_queries_not_using_indexes=ON  #Logging Queries That Don't Use Indexes

server_id=1
log-bin=/data/logs/mysql/mysql-bin
expire_logs_days = 10


#
# * Galera-related settings
#
[galera]
# Mandatory settings
#wsrep_on=ON
#wsrep_provider=
#wsrep_cluster_address=
#binlog_format=row
#default_storage_engine=InnoDB
#innodb_autoinc_lock_mode=2
#
# Allow server to accept connections on all interfaces.
#
#bind-address=0.0.0.0
#
# Optional setting
#wsrep_slave_threads=1
#innodb_flush_log_at_trx_commit=0

# this is only for embedded server
[embedded]

# This group is only read by MariaDB servers, not by MySQL.
# If you use the same .cnf file for MySQL and MariaDB,
# you can put MariaDB-only options here
[mariadb]

# This group is only read by MariaDB-10.11 servers.
# If you use the same .cnf file for MariaDB of different versions,
# use this group for options that older servers don't understand
[mariadb-10.11]

```
### 若使用本人数据库配置，需要执行下面命令
```shell
mkdir -pv /data/logs/mysql/ /data/mysql
chown mysql.mysql -R  /data/logs/mysql/ /data/mysql
mysql_install_db --user=mysql
```

## 2.启动mariadb服务
```shell
systemctl restart mariadb
echo -e '\n127.0.0.1 mysql' >> /etc/hosts   # 用于添加mysql本地解析
```

## 2.1 本项目使用了数据库时区转换，需要配置时区 [官方文档](https://mariadb.com/kb/en/mariadb-tzinfo-to-sql/)

```shell
mariadb-tzinfo-to-sql /usr/share/zoneinfo | mariadb -u root mysql
```

## 3.创建服务所需的数据库和用户授权信息
```shell
mysql
```
```shell
create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';
```

## 3.修改服务端配置，使用MySQL数据库

### 修改```config.yml```
```shell
# mysql 数据库配置
# create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
# grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';

DB_ENGINE: mysql
DB_HOST: mysql
DB_PORT: 3306
DB_USER: server
DB_DATABASE: xadmin
DB_PASSWORD: KGzKjZpWBp4R4RSa
```

## 4.本地部署直接重启生效
```shell
source /data/xadmin/py312/bin/activate
cd /data/xadmin/xadmin-server/
python manage.py restart all -d
```

## 5.容器部署，需要添加容器授权，并重启
### 获取容器的IP地址，用于mysql授权
```shell
mysql
```
```shell
grant all on xadmin.* to server@'192.168.196.%' identified by 'KGzKjZpWBp4R4RSa';
```
### 重启容器服务
```shell
cd /data/xadmin/xadmin-server
docker compose down
docker compose up -d
```