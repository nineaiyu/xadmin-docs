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
            'access_key': "your-access-key-id",
            'secret_key': "your-access-key-secret",
            'endpoint_url': "http://your-bucket.oss-cn-zhangjiakou.aliyuncs.com",  # https 环境请同步改为 https
            'bucket_name': "xadmin-oss",
            'url_protocol': 'http:', # 使用 http协议，默认是 https协议
            'custom_domain':'cdn.example.com/xadmin-oss'  # cdn域名（占位符），加速文件下载分发
            # 如果没有cdn加速域名，需要配置oss域名，不要加http，还需要在oss配置 公共读 权限
            # 'custom_domain':'your-bucket.oss-cn-zhangjiakou.aliyuncs.com/xadmin-oss'
        },
    },
    'staticfiles': {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    }
}

```

## 2. MinIO / S3 兼容存储配置

> 项目未内置 MinIO 专用配置键（`config.yml` 中的 `MINIO_*` 不会被读取，未登记的配置键会被静默忽略）：
> 请走 django-storages 的 S3 后端接入任意 S3 兼容服务，参数直接写在 `STORAGES` 的 `OPTIONS` 里。
> 若希望改为从 `config.yml` 读取，需先在 `server/conf/defaults.py` 登记配置键后再经 `CONFIG` 引用。

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
### 静态文件也可一起放在 MinIO 中，不过也可以放在本地
STORAGES = {
    'default': {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            'access_key': "your-minio-access-key",
            'secret_key': "your-minio-secret-key",
            'endpoint_url': "http://127.0.0.1:9000",   # MinIO 服务地址
            'bucket_name': "xadmin",                    # 桶名称，需自己创建
            'file_overwrite': False,                    # 同名文件是否允许覆盖
            'use_ssl': False,                           # http 环境 False；https 为 True
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
