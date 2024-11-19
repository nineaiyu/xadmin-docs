# NGINX安装部署

## 1.安装NGINX服务，如果有可跳过

```shell
dnf module switch-to nginx:1.24 -y
dnf install nginx -y
```

## 2.1添加 xadmin-api 服务配置，新创建文件```/etc/nginx/conf.d/xadmin-api-conf```

```shell
proxy_pass http://127.0.0.1:8896;
proxy_buffering off;
proxy_request_buffering off;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $http_connection;
proxy_set_header X-Forwarded-For $remote_addr;
#proxy_set_header X-Forwarded-Host $host:$server_port;  # 非默认的80，443端口，则需要打开该配置
proxy_set_header X-Forwarded-Proto $scheme;
#proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # 如果上层还有其他 slb 需要使用 $proxy_add_x_forwarded_for 获取真实 ip

proxy_ignore_client_abort on;
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;
send_timeout 6000;
```

## 2.2添加 Nginx 反向代理配置，新创建文件```/etc/nginx/conf.d/xadmin.conf```

```shell
server {
    listen       80;
    server_name xadmin.dvcloud.xin; # 填写自己的域名

#    # ssl 相关配置
#    listen 443 ssl;
#    ssl_certificate        /data/cert/xadmin.dvcloud.xin.pem; # 填写自己的域名证书
#    ssl_certificate_key    /data/cert/xadmin.dvcloud.xin.key; # 填写自己的域名证书
#    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
#    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5:!3DES;
#    ssl_prefer_server_ciphers on;
#    ssl_session_cache shared:SSL:10m;
#    ssl_session_timeout 10m;
#    add_header Strict-Transport-Security "max-age=31536000";

#     # 端口跳转，自动跳转443端口
#     if ($server_port !~ 443){
#         rewrite ^(/.*)$ https://$host$1 permanent;
#     }

#     如果使用cdn,需要配置该选项
#     set_real_ip_from 0.0.0.0/0;
#     real_ip_header X-Forwarded-For;

    root /data/xadmin/xadmin-client/dist/;
    index index.html index.htm;

    # 资源服务直接通过nginx访问，减少服务端压力
    location ^~ /media/ {
        alias /data/xadmin/xadmin-server/data/upload/;
        try_files $uri $uri/ @media;
    }

    location @media {
        include conf.d/xadmin-api-conf;
    }

    # api 服务
    location ~ ^/(api|ws|flower|media|api-docs) {
        include conf.d/xadmin-api-conf;
    }

    # 前端
    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    location ~ ^/(\.user.ini|\.htaccess|\.git|\.svn|\.project|LICENSE|README.md)
    {
        return 404;
    }

    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$
    {
        expires      30d;
        error_log off;
        access_log /dev/null;
    }

    location ~ .*\.(js|css)?$
    {
        expires      12h;
        error_log off;
        access_log /dev/null;
    }
    access_log /var/log/nginx/xadmin_access.log;
    error_log /var/log/nginx/xadmin_error.log;
}
```

## 3.检查配置并启动

```shell
nginx -t && systemctl restart nginx
```

## 4.在浏览器数据本地地址，进行访问