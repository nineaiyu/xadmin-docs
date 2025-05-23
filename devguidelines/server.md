# 1.服务端本地容器化开发

环境依赖：Docker 环境 [下载](https://www.docker.com) 并安装运行 docker desktop

为了防止容器过度使用机器资源，可将内存资源限制为2G (内存充足可忽略)

- [Windows 资源限制](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config#configure-global-options-with-wslconfig)

# ！！！ 注意
每当依赖(requirements.txt或Python版本)有更新，必须在xadmin-server项目目录下，执行构建容器镜像命令``` docker compose build```

## Pycharm 配置开发

### 1.打开pycharm，进行配置，操作如下：

- ![img_1.png](img_1.png)
- ![img_2.png](img_2.png)
- ![img_13.png](img_13.png)
- ![img_3.png](img_3.png)

### 2.如果有异常，可能需要退出，重新启动pycharm

### 3.启动服务进行开发

- 编辑Django启动配置
  ![img_5.png](img_5.png)
- 修改主机地址和端口
  ![img_6.png](img_6.png)
- 点击运行按钮，启动服务
  ![img_4.png](img_4.png)
  ![img_7.png](img_7.png)

## visual studio code 配置使用

安装容器化开发插件
![img.png](vscode/img.png)
![img_1.png](vscode/img_1.png)
![img_2.png](vscode/img_2.png)

# 2.远端开发，需要配置Redis，postgresql，python 环境

不限平台

# 3.本地开发，需要配置Redis，postgresql，python 环境

前端不限平台

后端支持mac, 有限支持Windows， Windows平台无法正常启动任务监控命令
