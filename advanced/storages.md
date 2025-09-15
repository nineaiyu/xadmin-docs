## 使用第三方对象存储

项目默认是本地存储，资源可使用NGINX直接访问

提供OSS存储方案，参考[django-storages官方文档](https://django-storages.readthedocs.io/en/latest/)

## 1.阿里云oss存储配置

### a.安装相关存储包

```shell
pip install django-storages boto3
```

### b.添加第三方应用

```python
# server/settings/base.py
INSTALLED_APPS = [
    ...
    'storages', # 添加到这里
    *XADMIN_APPS,
    'common.apps.CommonConfig',  # 这个放到最后, django ready
]
```

### c.修改存储默认配置

```python
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            'access_key': "LTA*****fJdcR",
            'secret_key': "lAj*****6Zi",
            'endpoint_url': "http://xadmin-dev-oss.oss-cn-zhangjiakou.aliyuncs.com", # 使用https报错？？？
            'bucket_name': "xadmin-dev-oss",
            'custom_domain':'devcdn.dvcloud.xin/xadmin-dev-oss'  # cdn域名，加速文件下载分发
            # 如果没有cdn加速域名，需要配置oss域名，不要加http，还需要在oss配置 公共读 权限
            # 'custom_domain':'xadmin-dev-oss.oss-cn-zhangjiakou.aliyuncs.com/xadmin-dev-oss'  
        },
    },
    'staticfiles': {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    }
}

```

## 2.MINIO存储配置

### 添加配置

``` yml
# config.yml

# Minio服务地址
MINIO_ENDPOINT_URL: "http://127.0.0.1:9000"
# Minio账号或KEY
MINIO_ACCESS_KEY: "USR"
# Minio密码或KEY
MINIO_SECRET_KEY: "PWD"
# Minio中桶名称，需要自己创建
MINIO_BUCKET_NAME: "xadmin"
# 同名文件是否允许覆盖
MINIO_FILE_OVERWRITE: false
# 是否使用Https，False就是使用Http
MINIO_USE_SSL: false
```

```shell
pip install django-storages boto3 minio
```

### 添加配置

``` yml
# config.yml

# Minio服务地址
MINIO_ENDPOINT_URL: "http://127.0.0.1:9000"
# Minio账号或KEY
MINIO_ACCESS_KEY: "USR"
# Minio密码或KEY
MINIO_SECRET_KEY: "PWD"
# Minio中桶名称，需要自己创建
MINIO_BUCKET_NAME: "xadmin"
# 同名文件是否允许覆盖
MINIO_FILE_OVERWRITE: false
# 是否使用Https，False就是使用Http
MINIO_USE_SSL: false
```

### b.添加第三方应用

```python
# server/settings/base.py
INSTALLED_APPS = [
    ...
    'storages', # 添加到这里
    *XADMIN_APPS,
    'common.apps.CommonConfig',  # 这个放到最后, django ready
]
```

### c.修改存储默认配置

```python
### 静态文件也可一起放在OSS中，不过也可以放在本地
STORAGES = {
    'default': {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            'access_key': CONFIG.MINIO_ACCESS_KEY,
            'secret_key': CONFIG.MINIO_SECRET_KEY,
            'endpoint_url': CONFIG.MINIO_ENDPOINT_URL,
            'bucket_name': CONFIG.MINIO_BUCKET_NAME,
            'file_overwrite': CONFIG.MINIO_FILE_OVERWRITE,
            'use_ssl': CONFIG.MINIO_USE_SSL
        },
    },
    'staticfiles': {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    }
}
```

### 实际使用若需要删除时，删除对应文件，模型继承AutoCleanFileMixin

```python
from django.db import models
from common.core.models import AutoCleanFileMixin
# AutoCleanFileMixin 得放前面，不然会被重写，不生效
class Material(AutoCleanFileMixin,DbAuditModel):
    file = models.FileField(verbose_name="文件", upload_to=upload_directory_path, null=True, blank=True)
```
