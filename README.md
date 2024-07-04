# alist-github-releases-files
自动获取 Github Releases 中的文件，生成地址树并更新 AList 驱动。

filesConfig.json
``` javascript
{
  "owner": "panpanaw", //仓库所有者
  "name": "alist-files", //仓库名称
  "dir": {  //文件夹名称和 Releases tag 映射
    "原": "2024.7.4.11.08",
    "test/原": "2024.7.4.11.08"
  }
}
```

AListStorageConfig.json AListApi,自行查询
``` javascript
{
  "id":0, //驱动id
  "mount_path":"/", //挂载目录
  "order":0,
  "driver":"UrlTree",
  "cache_expiration":0,
  "status":"work",
  "remark":"",
  "modified":"",
  "disabled":false,
  "enable_sign":false,
  "order_by":"",
  "order_direction":"",
  "extract_folder":"",
  "web_proxy":true,
  "webdav_policy":"302_redirect",
  "proxy_range":false,
  "down_proxy_url":"", //下载代理url
  "addition": {
    "head_size":false
  }
}
```
