const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;

// 获取歌单内容
app.get('/api/playlist', async (req, res) => {
    const playlistId = '591423731'; // 替换为你的歌单ID
    const apiUrl = `http://localhost:3000/playlist/detail?id=${playlistId}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: '查询失败' });
    }
});

// 获取推荐歌单内容
app.get('/api/recommend', async (req, res) => {
    const recommendId = '3136952023'; // 推荐歌单ID
    const apiUrl = `http://localhost:3000/playlist/detail?id=${recommendId}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: '获取推荐失败' });
    }
});

// 静态文件路径
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
