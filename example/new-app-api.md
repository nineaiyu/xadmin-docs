# 后端操作

> **教程定位**：手写理解版（逐层拆解"为什么这么写"）。**快速上手优先走生成器主线**：
> [《30 分钟：开发第一个业务模块》](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/guide/first-module-30min.md)；
> 权威文档索引见[二次开发文档地图](/guide/index#二次开发文档地图)（组件手册 / 扩展流程 / 选型对比）。
>
> 注：仓库自带 demo app（Book）为**官方示例**（含上架审批 / 二次确认 / 回收站与变更历史 /
> 定时任务接入，与框架同步演进；二开抄作业地图见 `demo/README.md`）；
> 本文代码为教学简化版，最新形态以仓库真源为准。

**两条路对照**（本文手写步骤 ↔ `generate_crud` 一条命令的产物）：

| 本文步骤 | 生成器产物（`python manage.py generate_crud <app>.<Model>`） |
|----------|------------------------------------------------------------|
| §3 编写 models | 不变（模型仍需手写） |
| §4 编写序列化器 | `<app>/serializers.py`（生成块，幂等合并） |
| §5 编写视图 | `<app>/views.py`（生成块） |
| §6 新建 urls.py | `<app>/urls.py` |
| §7 新建 config.py | `<app>/config.py` |
| 菜单 / 权限码手工建（见 new-app-menu） | `loadjson/seed_<app>_<model>.json` + `loaddata` 装载 |
| 前端页面手写（见 new-app-client） | `src/views/<app>/<model>/` 三件套（xadmin-client 仓库） |

## 0.创建并修改 server 配置文件

```shell
cp config_example.yml config.yml
```

- a.将 config.yml 里面的 DB_PASSWORD，REDIS_PASSWORD 取消注释
- b.生成，并填写 SECRET_KEY，加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值

```shell
cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
```

将上面的命令生成的字符串填写到 config.yml 里面的 ```SECRET_KEY``` 配置项

```shell
# 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
# $ cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
SECRET_KEY: django-insecure-mlq6(#a^2vk!1=7=xhp#$i=o5d%namfs=+b26$m#sh_2rco7j^
```

> 现状提示：开发环境**没有 config.yml 也能启动**——框架会回落读取 `config_example.yml` 并自动生成
> `SECRET_KEY`（持久化到 `data/.secret_key`）；生产环境仍必须显式配置（多实例一致 + 已加密数据可解）。
> 直接使用仓库提供的 `bash utils/dev_up.sh` 一键启动时，本节可跳过。

## 1.创建 django app

> 本教程沿用**仓库内置的 `demo` app**（四件套齐全、可直接对照阅读，**无需创建**）；若从零练习，
> 请把下文中的 `demo` 替换为你的 app 名后执行下面的命令。使用生成器主线时无需手工创建
> （`generate_crud` 会自动补齐结构）。

```shell
python3 manage.py startapp <你的 app 名>   # 仅从零练习时执行；仓库内置 demo 无需创建
```

## 2.在 ```config.yml``` 里面添加我们的app

```shell
# 需要将创建的应用写到里面 # 文件位置 config.yml ,否则菜单中，找不到模型关联
XADMIN_APPS:
  - 'demo.apps.DemoConfig'
```

## 3.编写models

> 以下为**教学简化版**（字段子集）；仓库内真实样例 `demo/models.py` 已含 `AutoCleanFileMixin`、
> `UploadFile` 单/多附件关联（`file` / `files`）等完整形态，以真源为准。

```shell
# 文件位置 demo/models.py

from django.db import models
from django.utils import timezone
from pilkit.processors import ResizeToFill

from common.core.models import DbAuditModel, upload_directory_path
from common.fields.image import ProcessedImageField
from system.models import UserInfo


class Book(DbAuditModel):
    class CategoryChoices(models.IntegerChoices):
        DIRECTORY = 0, "小说"
        MENU = 1, "文学"
        PERMISSION = 2, "哲学"

    # choices 单选
    category = models.SmallIntegerField(choices=CategoryChoices, default=CategoryChoices.DIRECTORY,
                                        verbose_name="书籍类型")

    # ForeignKey  一对多关系
    admin = models.ForeignKey(to=UserInfo, verbose_name="管理员1", on_delete=models.CASCADE)
    admin2 = models.ForeignKey(to=UserInfo, verbose_name="管理员2", on_delete=models.CASCADE,
                               related_name="book_admin2")

    # ManyToManyField 多对多关系
    managers = models.ManyToManyField(to=UserInfo, verbose_name="操作人员1", blank=True, null=True,
                                      related_name="book_managers")
    managers2 = models.ManyToManyField(to=UserInfo, verbose_name="操作人员2", blank=True, null=True,
                                       related_name="book_managers2")
    # 图片上传，原图访问
    cover = models.ImageField(verbose_name="书籍封面原图", null=True, blank=True)

    # 图片上传，压缩访问， 比如库里面存的图片是 xxx/xxx/123.png ， 压缩访问路径可以为 xxx/xxx/123_1.jpg
    # 定义了 scales=[1, 2, 3, 4] ，因此有四个压缩链接文件名  123_1.jpg 123_2.jpg 123_3.jpg 123_4.jpg
    # 原图文件名 123.png
    avatar = ProcessedImageField(verbose_name="书籍封面缩略图", null=True, blank=True,
                                 upload_to=upload_directory_path,
                                 processors=[ResizeToFill(512, 512)],  # 默认存储像素大小
                                 scales=[1, 2, 3, 4],  # 缩略图可缩小倍数，
                                 format='png')

    # 文件上传
    book_file = models.FileField(verbose_name="书籍存储", upload_to=upload_directory_path, null=True, blank=True)

    # 普通字段
    name = models.CharField(verbose_name="书籍名称", max_length=100, help_text="书籍名称啊，随便填")
    isbn = models.CharField(verbose_name="标准书号", max_length=20)
    author = models.CharField(verbose_name="书籍作者", max_length=20, help_text="坐着大啊啊士大夫")
    publisher = models.CharField(verbose_name="出版社", max_length=20, default='大宇出版社')
    publication_date = models.DateTimeField(verbose_name="出版日期", default=timezone.now)
    price = models.FloatField(verbose_name="书籍售价", default=999.99)
    is_active = models.BooleanField(verbose_name="是否启用", default=False)

    class Meta:
        verbose_name = '书籍名称'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.name}"

```

> **快速通道（可选）**：模型写好后，后端四件套 + 前端页面 + 菜单种子可由代码生成器一次产出——
> ```shell
> python manage.py generate_crud demo.Book [--frontend-root ../xadmin-client] [--with-import-export] [--dry-run]
> ```
> 生成物与下面各节手写范式同源（服务端 [ADR-027](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/adr/ADR-027-code-generator.md)），
> 生成后仍需按本教程复核（关联字段 `input_type`、菜单上级）。下文保留手写步骤，便于逐层理解与按需改写。

## 4.编写序列化器【请务必仔细阅读】

#### 在```demo```目录中，新创建一个```serializers```目录，然后在其中创建```book.py```文件

```shell
# 文件位置 demo/serializers/book.py

from rest_framework import serializers

from common.core.serializers import BaseModelSerializer
from common.fields.utils import input_wrapper
from demo import models


class BookSerializer(BaseModelSerializer):
    class Meta:
        model = models.Book
        ## pk 字段用于前端删除，更新等标识，如果有删除更新等，必须得加上 pk 字段
        ## 数据返回的字段，该字段受字段权限控制
        fields = [
            'pk', 'name', 'isbn', 'category', 'is_active', 'author', 'publisher', 'publication_date', 'price', 'block',
            'created_time', 'admin', 'admin2', 'managers', 'managers2', 'avatar', 'cover', 'book_file', 'updated_time',
        ]
        ## 仅用于前端table表格字段有顺序的展示，如果没定义，默认使用 fields 定义的变量
        ## 为啥要有这个变量？ 一般情况下，前端table表格宽度不够，不需要显示太多字段，就可以通过这个变量来控制显示的字段
        table_fields = [
            'pk', 'cover', 'category', 'name', 'is_active', 'isbn', 'author', 'publisher', 'publication_date', 'price',
            'book_file'
        ]

        # fields_unexport = ['pk']  # 导入导出文件时，忽略该字段

        # read_only_fields = ['pk']  # 表示pk字段只读, 和 extra_kwargs 定义的 pk 含义一样

        ## 构建字段的额外参数
        # # extra_kwargs包含了admin 单对多的两种方式，managers 多对多的两种方式，区别在于自定义的input_type，
        # # 观察前端页面变化和 search-columns 请求的数据
        extra_kwargs = {
            'pk': {'read_only': True},  # 表示pk字段只读
            'admin': {
                'attrs': ['pk', 'username'], 'required': True, 'format': "{username}({pk})",
                'input_type': 'api-search-user'
            },
            'admin2': {
                'attrs': ['pk', 'username'], 'required': True, 'format': "{username}({pk})",
            },
            'managers': {
                'attrs': ['pk', 'username'], 'required': True, 'format': "{username}({pk})",
                'input_type': 'api-search-user'
            },
            'managers2': {
                'attrs': ['pk', 'username'], 'required': False, 'format': "{username}({pk})",
            }
        }

    # # 该方法定义了管理字段，和 extra_kwargs 定义的 admin 含义一样，该字段会被序列化为
    # # 定义带有关联关系的字段，比如上面的admin，则额外参数中，input_type 和 attrs 至少存在一个，要不然前端可能会解析失败
    # # { "pk": 2, "username": "admin", "label": "admin(2)" }
    # # attrs 变量，表示展示的字段，有 pk,username 字段， 且 pk 字段是必须的， 比如 'attrs': ['pk']
    # # format 变量，表示label字段展示内容，里面的字段一定是属于 attrs 定义的字段，写错的话，可能会报错
    # # queryset 变量， 表示数据查询对象集合，注意：search-columns 方法中，该字段会有个 choices 变量，并且包含所有queryset数据，
    # #      如果数据量特别大的时候，一定要自定义 input_type， 否则会有问题
    # # input_type 变量， 自定义，如果存在，前端解析定义的类型 api-search-user ，并且 search-columns 方法中，choices变量为 []
    # #      如果数据量特别大的时候，推荐这种写法
    # # 目前，可以注释了，在父类里面，已经定义了 serializer_related_field 字段， 建议写到 extra_kwargs 里面，使用系统会自动生成
    # # 或者 按照下面方法自己定义。
    # # 为啥推荐写到 extra_kwargs ？ 写到extra_kwargs里面，系统会自动传一些参数， 可以省略 queryset , label 等参数
    # admin = BasePrimaryKeyRelatedField(attrs=['pk', 'username'], label="管理员", required=True,
    #                                    format="{username}({pk})", queryset=UserInfo.objects,
    #                                    input_type='api-search-user')

    # # 目前，可以注释了，在父类里面，已经定义了 serializer_choice_field 字段， 系统会自动生成
    # category = LabeledChoiceField(choices=models.Book.CategoryChoices.choices,
    #                               default=models.Book.CategoryChoices.DIRECTORY)

    # 自定义 input_type ，设置了 read_only=True 意味着只能通过详情查看，在新增和编辑页面不展示该字段
    # input_type 仅是前端组件渲染识别用， 可以自定义input_type ,但是前端组件得对定义的input_type 进行渲染
    # 前端自定义组件库 src/components/RePlusPage/src/components
    # 渲染组件定义 src/components/RePlusPage/src/utils/columns.tsx
    block = input_wrapper(serializers.SerializerMethodField)(read_only=True, input_type='boolean',
                                                             label="自定义input_type")

    def get_block(self, obj):
        return obj.is_active

```

> 以上为**教学简化版**（单表单 + 字段子集）；仓库内真实示例 `demo/serializers/book.py` 已演进为
> `tabs` 分组表单（基本信息 / 管理员 / 文件信息）并扩展了 `file` / `files` 附件字段——两者对照阅读即可。

进阶：表单字段较多时，可在 `Meta` 里用 `tabs = [TabsColumn("分组名", ["字段", ...]), ...]`
做分组表单（真实示例见 `demo/serializers/book.py`）。**序列化器声明式字段会同时驱动
search-columns 元数据与前端渲染**——改字段先想清楚三层影响（元数据/权限码关联模型/前端列）。
最新完整版始终以仓库内 `demo/serializers/book.py` 与 `demo/views.py` 为准。

## 5.编写视图

```shell
# 文件位置 demo/views.py

from django_filters import rest_framework as filters
from rest_framework.decorators import action

from common.core.filter import BaseFilterSet, PkMultipleFilter
from common.core.modelset import BaseModelSet, ImportExportDataAction
from common.core.pagination import DynamicPageNumber
from common.core.response import ApiResponse
from common.utils import get_logger
from demo.models import Book
from demo.serializers.book import BookSerializer

logger = get_logger(__name__)


class BookViewSetFilter(BaseFilterSet):
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')
    author = filters.CharFilter(field_name='author', lookup_expr='icontains')
    publisher = filters.CharFilter(field_name='publisher', lookup_expr='icontains')

    # 自定义的搜索模板，针对用户搜索，前端已经内置 api-search-user 模板处理
    managers2 = PkMultipleFilter(input_type="api-search-user")
    # 关联关系搜索的时候，默认是主键pk；数据量大时可改为输入框（input）
    managers = PkMultipleFilter(input_type="input")

    class Meta:
        model = Book
        fields = ['name', 'isbn', 'author', 'publisher', 'is_active', 'publication_date', 'price',
                  'created_time', 'managers', 'managers2']  # fields用于前端自动生成的搜索表单


class BookViewSet(BaseModelSet, ImportExportDataAction):
    """书籍"""  # 这个 书籍 的注释得写， 否则菜单中可能会显示null，访问日志记录中也可能显示异常

    queryset = Book.objects.all()
    serializer_class = BookSerializer
    ordering_fields = ['created_time']
    filterset_class = BookViewSetFilter
    pagination_class = DynamicPageNumber(1000)  # 表示最大分页数据1000条，如果注释，则默认最大100条数据

    @action(methods=['post'], detail=True)
    def push(self, request, *args, **kwargs):
        """推送到其他服务"""  # 这个 推送到其他服务 的注释得写， 否则菜单中可能会显示null，访问日志记录中也可能显示异常

        # 自定义一个请求为post的 push 路由行为，执行自定义操作， action装饰器有好多参数，可以查看源码自行分析
        instance = self.get_object()
        return ApiResponse(detail=f"{instance.name} 推送成功")


```

## 6.新建```urls.py```路由文件，并添加路由

```shell
# 文件位置 demo/urls.py

from rest_framework.routers import SimpleRouter

from demo.views import BookViewSet

app_name = 'demo'

router = SimpleRouter(False)  # 设置为 False ,为了去掉url后面的斜线

router.register('book', BookViewSet, basename='book')

urlpatterns = [
]
urlpatterns += router.urls
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

## 8.迁移 demo 应用

> 仓库内置 demo 自带迁移（随 `init_data` / `migrate` 建表），无需手工迁移；本节针对你自己的 app。

```shell
python manage.py makemigrations
python manage.py migrate
```

## 9.同步模型字段，或者在web页面字段管理里面，点击重新生成字段数据按钮

```shell
python manage.py sync_model_field
```
