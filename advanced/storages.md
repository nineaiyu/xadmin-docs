## 使用对象存储（内置可插拔后端）

项目默认使用本地磁盘存储（`data/upload`，资源可由 NGINX 直接访问），并内置
**声明式可插拔存储后端**（P-4）：在「系统配置」里把 `FILE_STORAGE_BACKEND` 改为 `s3`，
即可切换到任意 S3 兼容对象存储（MinIO / 阿里云 OSS / AWS S3 等），
**运行期热生效——不需要改代码、不需要重建镜像**。

> 完整的搬迁 / 校验 / 回迁 / 排障说明见服务端仓库 `xadmin-server/docs/ops/storage.md`。

## 1. 启用步骤

### a.安装可选依赖

```shell
# 在每个运行文件链路的进程所在环境安装（server / celery-worker / celery-heavy）
pip install django-storages boto3
# 或使用 uv 快路径（服务端仓库）
uv pip install django-storages boto3
```

### b.在「系统配置」填写存储后端

| 配置键 | 示例 | 说明 |
|--------|------|------|
| `FILE_STORAGE_BACKEND` | `s3` | `local`（默认）/ `s3` |
| `FILE_S3_ENDPOINT` | `http://minio:9000` | S3 兼容服务地址（AWS 可留空） |
| `FILE_S3_BUCKET` | `xadmin` | 桶名（需先创建） |
| `FILE_S3_ACCESS_KEY` | `your-access-key` | 加密存储，界面不回显 |
| `FILE_S3_SECRET_KEY` | `your-secret-key` | 加密存储，界面不回显 |
| `FILE_S3_REGION` | `us-east-1` | 可留空 |
| `FILE_S3_CUSTOM_DOMAIN` | `cdn.example.com/xadmin` | 可选；非空时文件 URL 不签名（需桶公开读） |
| `FILE_S3_ADDRESSING_STYLE` | `path` | MinIO 常需 `path`；AWS 留空 |

### c.搬迁存量文件并校验

```shell
python manage.py storage_migrate --dry-run   # 先看统计（幂等：大小一致自动跳过）
python manage.py storage_migrate             # 执行搬迁（可中断，重跑即断点续搬）
python manage.py storage_migrate --verify     # 校验存在性与大小（--md5 追加逐文件比对）
```

回迁 / 撤离对象存储：`python manage.py storage_migrate --direction pull`，
并把手动把 `FILE_STORAGE_BACKEND` 改回 `local`。

## 2. 与手工改 settings 的关系

内置后端（`common.storage.SwitchableStorage`）已接管 `STORAGES["default"]`：
上传 / 下载 / 预览 / 缩略图 / `/media/` 兜底全部按当前配置路由，未启用对象存储时
行为与 Django 默认的 `FileSystemStorage` 完全一致（零变化）。

因此**不再推荐**手工修改 `STORAGES`（历史方案见 §4）：手工指向
`storages.backends.s3.S3Storage` 虽然也能工作，但会绕过配置热切换、
搬迁命令与 health 存储探针。

## 3. 常见服务配置示例

| 服务 | ENDPOINT | ADDRESSING_STYLE | 备注 |
|------|----------|------------------|------|
| MinIO | `http://minio:9000` | `path` | 桶需自行创建；http 环境用 `http://` |
| 阿里云 OSS | `https://oss-cn-zhangjiakou.aliyuncs.com` | 留空 | 配 CDN 时填 `FILE_S3_CUSTOM_DOMAIN` |
| AWS S3 | 留空 | 留空 | 必填 `FILE_S3_REGION` |

## 4. 手工方案（历史，保留参考）

> 以下为内置后端之前的手工方案：直接改写 `server/settings/base.py` 的 `STORAGES`。
> 现有部署若已按此配置，可继续使用；迁移到内置后端的做法是把 `STORAGES["default"]`
> 去掉（恢复 `common.storage.SwitchableStorage`）并在系统配置里填写同样参数。

### a.添加第三方应用

```python
# server/settings/base.py
INSTALLED_APPS = [
    ...
    'storages', # 添加到这里
    *XADMIN_APPS,
    'common.apps.CommonConfig',  # 这个放到最后, django ready
]
```

### b.修改存储默认配置（阿里云 OSS 示例）

```python
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            'access_key': "your-access-key-id",
            'secret_key': "your-access-key-secret",
            'endpoint_url': "http://your-bucket.oss-cn-zhangjiakou.aliyuncs.com",
            'bucket_name': "xadmin-oss",
            'url_protocol': 'http:',
            'custom_domain': 'cdn.example.com/xadmin-oss'
        },
    },
    'staticfiles': {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    }
}
```

### c.模型删除联动

```python
from django.db import models
from common.core.models import AutoCleanFileMixin
# AutoCleanFileMixin 得放前面，不然会被重写，不生效
class Material(AutoCleanFileMixin, DbAuditModel):
    file = models.FileField(verbose_name="文件", upload_to=upload_directory_path, null=True, blank=True)
```
