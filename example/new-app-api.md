# 后端操作

## 1.创建 django app
```shell
python3 manage.py startapp demo
```

## 2.在 ```config.py``` 里面添加我们的app
```shell
# 需要将创建的应用写到里面 # 文件位置 config.py
XADMIN_APPS = [
    'demo.apps.DemoConfig',
]
```
## 3.编写models
```shell
# 文件位置 demo/models.py

from django.db import models

from common.core.models import DbAuditModel


class Book(DbAuditModel):
    name = models.CharField(verbose_name="书籍名称", max_length=100)
    isbn = models.CharField(verbose_name="标准书号", max_length=20)
    author = models.CharField(verbose_name="书籍作者", max_length=20)
    publisher = models.CharField(verbose_name="出版社", max_length=20)
    publication_date = models.DateTimeField(verbose_name="出版日期")
    price = models.FloatField(verbose_name="书籍售价")
    is_active = models.BooleanField(verbose_name="是否启用", default=True)

    class Meta:
        verbose_name = '书籍名称'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.name}"
```
## 4.编写序列化器
#### 在```demo```目录中，新创建一个```utils```目录，然后在```utils```目录中创建```serializer.py```文件
```shell
# 文件位置 demo/utils/serializer.py

from common.core.serializers import BaseModelSerializer
from demo import models


class BookSerializer(BaseModelSerializer):
    class Meta:
        model = models.Book
        ## pk 字段用于前端删除，更新等标识，如果有删除更新等，必须得加上pk 字段
        fields = ['pk', 'name', 'isbn', 'author', 'publisher', 'publication_date', 'price', 'is_active', 'created_time',
                  'updated_time']
        read_only_fields = ['pk']
        # fields_unexport = ['pk']  # 导入导出文件时，忽略该字段
```
## 5.编写视图
```shell
# 文件位置 demo/views.py

# Create your views here.

import logging

from django_filters import rest_framework as filters

from common.core.filter import BaseFilterSet
from common.core.modelset import BaseModelSet, ImportExportDataAction
from demo.models import Book
from demo.utils.serializer import BookSerializer

logger = logging.getLogger(__name__)


class BookFilter(BaseFilterSet):
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')
    author = filters.CharFilter(field_name='author', lookup_expr='icontains')
    publisher = filters.CharFilter(field_name='publisher', lookup_expr='icontains')

    class Meta:
        model = Book
        fields = ['isbn', 'author', 'publisher', 'is_active', 'publication_date', 'price',
                  'created_time']  # fields用于前端自动生成的搜索表单


class BookView(BaseModelSet, ImportExportDataAction):
    """
    书籍管理
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    ordering_fields = ['created_time']
    filterset_class = BookFilter

```

## 6.新建```urls.py```路由文件，并添加路由
```shell
# 文件位置 demo/urls.py

from rest_framework.routers import SimpleRouter

from demo.views import BookView

router = SimpleRouter(False)  # 设置为 False ,为了去掉url后面的斜线

router.register('book', BookView, basename='book')

urlpatterns = [
]
urlpatterns += router.urls

urlpatterns = router.urls
```

## 7.新建```config.py```文件，添加相关配置
```shell
# 文件位置 demo/config.py
from django.urls import path, include

# 路由配置，当添加APP完成时候，会自动注入路由到总服务
URLPATTERNS = [
    path('api/demo/', include('demo.urls')),
]

# 请求白名单，支持正则表达式，可参考settings.py里面的 PERMISSION_WHITE_URL
PERMISSION_WHITE_REURL = []
```

## 8.迁移demo应用
```shell
python manage.py makemigrations
python manage.py migrate
```