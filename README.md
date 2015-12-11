FeProxy
=====

### Desc

FeProxy is a proxy tool use for web development

- Map url to file, other url, other host

- Inpect net traffic to chrome

### 安装

```
$ [sudo] npm install feproxy -g
```

### 使用

```
$ feproxy
```

Proxy server on port: 8100

Inspect page on [http://127.0.0.1:8100/inspect](http://127.0.0.1:8100/inspect)

Manage page on [http://127.0.0.1:8100](http://127.0.0.1:8100)

#### 配置

`Rule`:

^http://qqweb\\.qq\\.com/m/qunactivity/(.*)$ file://Users/yuan/works/qunactivity_mobile/src/$1

offline\\.zip status://404

`Host`:

10.70.65.110 s.url.cn qqweb.qq.com

`Advance`:

^http://qqweb\\.qq\\.com/cgi-bin/.*$ 10.70.65.10 

### TODO

导入/导出 fiddler抓包saz文件

