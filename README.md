
### Desc

FeProxy is a proxy tool use for web development like the `Fiddler`, and we use `Chrome Devtools` to inpect net traffic.

- Inpect net traffic to chrome

[![inspect page](https://raw.githubusercontent.com/feix760/feproxy/master/docs/inspector.png)](http://127.0.0.1:8100/inspect)

- Map url to file, other url, other host

[![manage page](https://raw.githubusercontent.com/feix760/feproxy/master/docs/manage.png)](http://127.0.0.1:8100/inspect)

### Install

```
$ [sudo] npm install feproxy -g
```

### Usage

```
$ feproxy
```

Proxy server on port: 8100

Inspect page on [http://127.0.0.1:8100/inspect](http://127.0.0.1:8100/inspect)

Manage page on [http://127.0.0.1:8100](http://127.0.0.1:8100)

### Manage

`Rule`:

^http://qqweb\\.qq\\.com/m/qunactivity/(.*)$ file://Users/yuan/works/qunactivity_mobile/src/$1

offline\\.zip status://404

`Host`:

10.70.65.110 s.url.cn qqweb.qq.com

`Advance`:

^http://qqweb\\.qq\\.com/cgi-bin/.*$  10.70.65.10 

### TODO

export & import fiddler's *.saz file

