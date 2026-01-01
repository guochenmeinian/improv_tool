# 吉他音阶可视化工具

## 部署（Docker）

```bash
docker build -t guitar-visual .
docker run --rm -p 8080:80 guitar-visual
```

打开浏览器访问：`http://localhost:8080`

## 本地预览（无需构建）

```bash
python -m http.server 8000
```

打开浏览器访问：`http://localhost:8000`
