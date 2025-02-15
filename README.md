# 音乐探索 - 网易云音乐播放器

一个基于网易云音乐API的在线音乐播放器，具有优雅的UI设计和丰富的功能。

## 功能特点

- 🎵 创新的圆形音乐浏览界面
- 🎨 精美的UI设计和动画效果
- 🔍 智能搜索功能
- 📃 实时歌词显示
- 💫 流畅的音乐播放控制
- 📱 响应式设计，支持多设备
- 🎯 热门推荐功能
- 🎲 随机播放功能

## 技术栈

- 前端：HTML5, CSS3, JavaScript (ES6+)
- 后端：Node.js, Express
- API：网易云音乐API
- 依赖：axios

## 项目结构

```
├── public/
│   ├── images/         # 图片资源
│   ├── script.js       # 前端主要逻辑
│   ├── styles.css      # 样式文件
│   └── index.html      # 主页面
├── server.js           # 后端服务器
├── package.json        # 项目依赖
└── README.md          # 项目说明
```

## 安装和运行

1. 克隆项目
```bash
git clone [项目地址]
cd [项目目录]
```

2. 安装依赖
```bash
npm install
```

3. 运行网易云音乐API服务（需要单独安装）
```bash
# 在另一个终端运行网易云API服务
# 确保运行在 3000 端口
```

4. 运行项目
```bash
node server.js
```

5. 访问项目
打开浏览器访问 `http://localhost:3001`

## 主要功能说明

### 圆形音乐浏览器
- 创新的圆形布局展示歌曲
- 平滑的旋转动画
- 点击歌曲直接播放

### 音乐播放控制
- 播放/暂停
- 上一首/下一首
- 随机播放
- 进度条控制
- 音量调节

### 搜索功能
- 实时搜索
- 支持歌曲名和歌手名搜索
- 搜索结果即时显示

### 热门推荐
- 展示热门歌曲
- 显示播放次数和时长
- 支持直接播放

### 歌词显示
- 实时同步歌词
- 自动滚动
- 支持展开/收起

## 注意事项

1. 确保网易云音乐API服务正常运行在3000端口
2. 部分歌曲可能需要VIP权限
3. 推荐使用现代浏览器访问以获得最佳体验

## 开发者

- 前端UI设计和实现
- 后端API对接
- 音乐播放功能实现
- 动画效果优化

## 许可证

MIT License

## 鸣谢

- 感谢网易云音乐API提供的数据支持
- 感谢所有开源项目的贡献者 