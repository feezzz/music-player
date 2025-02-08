document.addEventListener('DOMContentLoaded', () => {
    // 获取圆形布局的 DOM 元素
    const circle = document.getElementById('circle');
    if (!circle) {
        console.error('circle element not found');
        return;
    }

    // 每个圆形布局中显示的歌曲数量
    const songsPerCircle = 20;

    // 当前旋转角度
    let rotationAngle = 0;

    // 当前播放歌曲的索引
    let currentSongIndex = -1;

    // 创建 Audio 对象用于播放音乐
    const audioPlayer = new Audio();

    // 获取播放/暂停按钮
    const playPauseButton = document.getElementById('play-pause-button');

    // 获取播放图标和暂停图标
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    // 获取进度条填充部分
    const progressFill = document.querySelector('.progress-bar__fill');

    // 当前是否正在播放
    let isPlaying = false;

    // 模拟歌曲时长（秒）
    const songDuration = 180;

    // 歌曲开始播放的时间
    let startTime;

    // 更新进度条的定时器
    let progressInterval;

    // 获取歌曲信息显示元素
    const currentSongElement = document.getElementById('current-song');
    const currentArtistElement = document.getElementById('current-artist');
    const songCoverElement = document.getElementById('song-cover');

    // 获取时间显示元素
    const currentTimeElement = document.getElementById('current-time');
    const totalTimeElement = document.getElementById('total-time');
    const vipTagElement = document.getElementById('vip-tag');
    const lyricsElement = document.getElementById('lyrics');
    const lyricsToggleButton = document.getElementById('lyrics-toggle');

    // 设置默认封面图片数组
    const DEFAULT_COVERS = [
        'images/covers/cover1.jpg',
        'images/covers/cover2.jpg',
        'images/covers/cover3.jpg',
        'images/covers/cover4.jpg',
        'images/covers/cover5.jpg'
    ];

    // 获取随机默认封面
    function getRandomDefaultCover() {
        const randomIndex = Math.floor(Math.random() * DEFAULT_COVERS.length);
        return DEFAULT_COVERS[randomIndex];
    }

    // 设置默认封面图片URL为随机封面
    const DEFAULT_COVER = getRandomDefaultCover();
    
    // 初始化默认封面
    songCoverElement.src = DEFAULT_COVER;

    // 暂停歌曲
    function pauseSong() {
        isPlaying = false;
        playIcon.style.display = 'block'; // 显示播放图标
        pauseIcon.style.display = 'none'; // 隐藏暂停图标
        clearInterval(progressInterval); // 清除进度条更新定时器
    }

    // 更新进度条
    function updateProgress() {
        const elapsedTime = Date.now() - startTime; // 计算已播放的时间
        const progress = (elapsedTime / (songDuration * 1000)) * 100; // 计算播放进度百分比
        progressFill.style.width = progress + '%'; // 更新进度条宽度
        if (progress >= 100) {
            pauseSong(); // 如果播放完成，暂停歌曲
        }
    }

    // 格式化时间
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 更新时间显示
    function updateTimeDisplay() {
        if (audioPlayer.duration) {
            currentTimeElement.textContent = formatTime(audioPlayer.currentTime);
            totalTimeElement.textContent = formatTime(audioPlayer.duration);
        }
    }

    // 从 API 获取歌曲列表
    fetch('/api/playlist')
        .then(response => response.json())
        .then(data => {
            if (!data.playlist || !data.playlist.tracks || data.playlist.tracks.length === 0) {
                console.error('播放列表为空或未找到');
                return;
            }

            // 获取歌曲列表
            const songs = data.playlist.tracks;
            
            // 计算圆形布局的半径
            const radius = circle.clientWidth / 2;

            // 随机获取歌曲索引
            function getRandomSongIndices(songs, count, excludedIndices = []) {
                const availableIndices = songs.reduce((acc, _, index) => {
                    if (!excludedIndices.includes(index)) {
                        acc.push(index);
                    }
                    return acc;
                }, []);

                const randomIndices = [];
                for (let i = 0; i < count && availableIndices.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * availableIndices.length);
                    randomIndices.push(availableIndices[randomIndex]);
                    availableIndices.splice(randomIndex, 1);
                }

                return randomIndices;
            }

            // 创建歌曲元素
            function createSongElements(songIndices) {
                const angleStep = (2 * Math.PI) / songsPerCircle;
                const circleRect = circle.getBoundingClientRect();
                const radius = 220; // 恢复到原来的半径
                const centerX = circleRect.width / 2;
                const centerY = circleRect.height / 2;

                songIndices.forEach((index, i) => {
                    const angle = i * angleStep;
                    const songElement = document.createElement('div');
                    songElement.classList.add('song');
                    songElement.textContent = songs[index].name;
                    songElement.dataset.index = index;
                    songElement.dataset.angle = angle;

                    updateSongPosition(songElement, angle, centerX, centerY);
                    
                    // 绑定点击事件，播放对应歌曲
                    songElement.addEventListener('click', () => {
                        if (currentSongIndex !== index) { // 如果点击的是不同的歌曲
                            playSong(index); // 播放指定歌曲
                        } else {
                            togglePlayPause(); // 如果是当前歌曲，切换播放暂停
                        }
                    });

                    circle.appendChild(songElement);
                });
            }

            // 更新歌曲元素位置
            function updateSongPosition(element, angle, centerX, centerY) {
                const radius = 220;
                // 计算歌曲元素的位置
                const x = centerX + radius * Math.cos(angle) - element.offsetWidth / 2;
                const y = centerY + radius * Math.sin(angle) - element.offsetHeight / 2;

                // 关键修改：rotation 现在直接使用 angle 转换为度数
                // 这样文字就会始终保持径向方向
                const rotation = (angle * 180 / Math.PI);

                // 为了使文字可读，当角度在90-270度之间时，将文字翻转180度
                const finalRotation = (rotation > 90 && rotation < 270)
                    ? rotation + 180
                    : rotation;

                element.style.transform = `translate(${x}px, ${y}px) rotate(${finalRotation}deg)`;
            }

            // 旋转歌曲元素
            let lastTime = Date.now();
            const ROTATION_SPEED = 0.0001; // 大幅降低旋转速度，从0.01改为0.0001

            function rotateSongs() {
                const currentTime = Date.now();
                const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
                lastTime = currentTime;

                rotationAngle += ROTATION_SPEED * deltaTime;
                const circleRect = circle.getBoundingClientRect();
                const centerX = circleRect.width / 2;
                const centerY = circleRect.height / 2;

                const songElements = circle.querySelectorAll('.song');
                songElements.forEach((element) => {
                    const baseAngle = parseFloat(element.dataset.angle);
                    const currentAngle = baseAngle + rotationAngle;
                    updateSongPosition(element, currentAngle, centerX, centerY);
                });

                requestAnimationFrame(rotateSongs);
            }

            // 更新当前歌曲信息
            async function updateCurrentSongInfo(song) {
                if (!song) return;
                
                currentSongElement.textContent = song.name;
                currentArtistElement.textContent = song.ar ? song.ar.map(artist => artist.name).join(', ') : '-';
                
                // 更新封面图片
                if (song.al && song.al.picUrl) {
                    songCoverElement.src = song.al.picUrl;
                } else {
                    songCoverElement.src = getRandomDefaultCover();
                }

                // 处理VIP标签显示
                if (song.fee === 1) { // 假设fee=1表示VIP歌曲
                    vipTagElement.style.display = 'inline-block';
                    if (song.duration) {
                        totalTimeElement.textContent = formatTime(song.duration / 1000);
                    }
                } else {
                    vipTagElement.style.display = 'none';
                }

                // 获取并显示歌词
                try {
                    const lyrics = await fetchLyrics(song.id);
                    displayLyrics(lyrics);
                } catch (error) {
                    console.error('获取歌词失败:', error);
                    displayLyrics(null);
                }
            }

            // 播放指定歌曲
            async function playSong(indexOrId) {
                let song;
                if (typeof indexOrId === 'number') {
                    // 通过索引播放
                    if (indexOrId < 0 || !songs[indexOrId]) return;
                    currentSongIndex = indexOrId;
                    song = songs[indexOrId];
                } else {
                    // 直接通过歌曲ID播放
                    song = songs.find(s => s.id === indexOrId) || recommendations.find(r => r.id === indexOrId);
                    if (!song) return;
                    currentSongIndex = songs.indexOf(song);
                }

                try {
                    const songUrl = await fetchSongUrl(song.id);
                    if (songUrl) {
                        audioPlayer.src = songUrl;
                        await updateCurrentSongInfo(song);
                        await audioPlayer.play();
                        updatePlayPauseButtonState();
                    }
                } catch (error) {
                    console.error('播放错误:', error);
                    alert('播放出错，请稍后重试');
                }
            }

            // 切换播放/暂停状态
            function togglePlayPause() {
                if (audioPlayer.paused) {
                    audioPlayer.play(); // 如果暂停，播放歌曲
                } else {
                    audioPlayer.pause(); // 如果播放，暂停歌曲
                }
                updatePlayPauseButtonState(); // 更新按钮状态
            }

            // 更新播放/暂停按钮状态
            function updatePlayPauseButtonState() {
                if (audioPlayer.paused) {
                    playIcon.style.display = 'block';
                    pauseIcon.style.display = 'none';
                    isPlaying = false;
                } else {
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'block';
                    isPlaying = true;
                }
            }

            // 监听音频播放状态变化
            audioPlayer.addEventListener('play', () => {
                updatePlayPauseButtonState();
            });

            audioPlayer.addEventListener('pause', () => {
                updatePlayPauseButtonState();
            });

            // 监听音频加载错误
            audioPlayer.addEventListener('error', (e) => {
                console.error('音频加载错误:', e);
                alert('音频加载失败，请稍后重试');
            });

            // 监听播放结束
            audioPlayer.addEventListener('ended', () => {
                // 播放下一首
                const nextIndex = (currentSongIndex + 1) % songs.length;
                playSong(nextIndex);
            });

            // 监听播放进度
            audioPlayer.addEventListener('timeupdate', () => {
                if (!audioPlayer.duration) return;
                
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = `${progress}%`;
                progressThumb.style.left = `${progress}%`;
            });

            // 获取随机播放和下一首按钮
            const randomButton = document.getElementById('random-button');
            const nextButton = document.getElementById('next-button');

            // 监听随机播放按钮点击事件
            randomButton.addEventListener('click', async () => {
                if (songs.length === 0) return;

                // 随机选择一首歌曲（避免选到当前歌曲）
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * songs.length);
                } while (newIndex === currentSongIndex && songs.length > 1);

                await playSong(newIndex);
                rotateCircleToCurrentSong(newIndex);
            });

            // 监听播放/暂停按钮的点击事件
            playPauseButton.addEventListener('click', () => {
                if (currentSongIndex === -1) {
                    // 如果没有歌曲被选择，随机播放一首
                    currentSongIndex = Math.floor(Math.random() * songs.length);
                    playSong(currentSongIndex);
                } else {
                    // 如果已经有歌曲，切换播放/暂停状态
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                    }
                }
            });

            // 播放下一首歌曲
            nextButton.addEventListener('click', async () => {
                if (songs.length === 0) return;

                // 顺序切换到下一首
                const nextIndex = (currentSongIndex + 1) % songs.length;
                await playSong(nextIndex);
                rotateCircleToCurrentSong(nextIndex);
            });

            //将圆形布局旋转到指定歌曲的位置
            function rotateCircleToCurrentSong(songIndex) {
                const songElements = circle.querySelectorAll('.song');
                const targetElement = [...songElements].find(el => parseInt(el.dataset.index) === songIndex);
            
                if (targetElement) {
                    // 获取目标歌曲的角度
                    const targetAngle = parseFloat(targetElement.dataset.angle);
            
                    // 更新全局旋转角度，使目标歌曲位于顶部
                    rotationAngle = -targetAngle;
            
                    // 强制更新所有歌曲的位置
                    const circleRect = circle.getBoundingClientRect();
                    const centerX = circleRect.width / 2;
                    const centerY = circleRect.height / 2;
            
                    songElements.forEach(element => {
                        const baseAngle = parseFloat(element.dataset.angle);
                        const currentAngle = baseAngle + rotationAngle;
                        updateSongPosition(element, currentAngle, centerX, centerY);
                    });
                }
            }

            // 自动切换到下一首歌曲
            audioPlayer.addEventListener('ended', () => {
                currentSongIndex = (currentSongIndex + 1) % songs.length; // 循环切换到下一首
                loadAndPlaySong(currentSongIndex);
            });

            // 获取进度条
            const progressBar = document.querySelector('.progress-bar');
            const progressThumb = document.querySelector('.progress-bar__thumb');

            // 更新进度条和圆点位置
            function updateProgressBar() {
                const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100; // 计算播放进度百分比
                progressFill.style.width = `${percentage}%`; // 更新进度条宽度
                progressThumb.style.left = `${percentage}%`; // 更新圆点位置
                requestAnimationFrame(updateProgressBar); // 继续更新
            }

            // 监听音频时间更新事件
            audioPlayer.addEventListener('timeupdate', updateProgressBar);

            // 点击进度条跳转到指定时间
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left; // 获取点击位置的 x 坐标
                const percentage = clickX / rect.width; // 计算点击位置的百分比
                audioPlayer.currentTime = percentage * audioPlayer.duration; // 跳转到指定时间
            });

            // 拖动圆点调整进度
            let isDragging = false;

            progressThumb.addEventListener('mousedown', () => {
                isDragging = true;
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const rect = progressBar.getBoundingClientRect();
                    let clickX = e.clientX - rect.left;
                    clickX = Math.max(0, Math.min(clickX, rect.width)); // 限制点击位置在进度条范围内
                    const percentage = clickX / rect.width; // 计算点击位置的百分比
                    audioPlayer.currentTime = percentage * audioPlayer.duration; // 跳转到指定时间
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // 获取歌曲 URL
            async function fetchSongUrl(songId, retries = 3) {
                try {
                    const response = await fetch(`http://localhost:3000/song/url?id=${songId}`);
                    const data = await response.json();
                    if (data?.data?.[0]?.url) {
                        return data.data[0].url;
                    }
                    throw new Error('无效的歌曲URL');
                } catch (error) {
                    if (retries > 0) {
                        console.log(`重试获取歌曲URL，剩余次数：${retries}`);
                        return fetchSongUrl(songId, retries - 1);
                    }
                    console.error('获取歌曲URL失败:', error);
                    return null;
                }
            }

            // 获取歌词
            async function fetchLyrics(songId) {
                try {
                    const response = await fetch(`http://localhost:3000/lyric?id=${songId}`);
                    const data = await response.json();
                    return data.lrc ? data.lrc.lyric : null;
                } catch (error) {
                    console.error('获取歌词失败:', error);
                    return null;
                }
            }

            // 解析歌词
            function parseLyrics(lyricsText) {
                if (!lyricsText) return [];

                const lines = lyricsText.split('\n');
                const pattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
                const result = [];

                lines.forEach(line => {
                    const match = pattern.exec(line);
                    if (match) {
                        const minutes = parseInt(match[1]);
                        const seconds = parseInt(match[2]);
                        const milliseconds = parseInt(match[3]);
                        const text = match[4].trim();
                        
                        if (text) {
                            const time = minutes * 60 + seconds + milliseconds / 1000;
                            result.push({ time, text });
                        }
                    }
                });

                return result.sort((a, b) => a.time - b.time);
            }

            // 显示歌词
            function displayLyrics(lyricsText) {
                const lyrics = parseLyrics(lyricsText);
                lyricsElement.innerHTML = '';

                if (lyrics.length === 0) {
                    lyricsElement.innerHTML = '<p class="lyrics-line">暂无歌词</p>';
                    return;
                }

                lyrics.forEach(line => {
                    const p = document.createElement('p');
                    p.className = 'lyrics-line';
                    p.textContent = line.text;
                    p.dataset.time = line.time;
                    lyricsElement.appendChild(p);
                });
            }

            // 更新当前歌词
            function updateCurrentLyric(currentTime) {
                const lines = lyricsElement.querySelectorAll('.lyrics-line');
                let activeFound = false;

                lines.forEach(line => {
                    const time = parseFloat(line.dataset.time);
                    if (time <= currentTime + 0.5) { // 添加0.5秒延迟使显示更自然
                        line.classList.add('active');
                        activeFound = true;
                        // 滚动到当前歌词
                        if (line.offsetTop > 0) {
                            lyricsElement.scrollTop = line.offsetTop - lyricsElement.clientHeight / 2;
                        }
                    } else {
                        line.classList.remove('active');
                    }
                });
            }

            // 监听音频时间更新
            audioPlayer.addEventListener('timeupdate', () => {
                updateTimeDisplay();
                updateCurrentLyric(audioPlayer.currentTime);
            });

            // 监听歌词切换按钮
            let lyricsExpanded = false;
            lyricsToggleButton.addEventListener('click', () => {
                lyricsExpanded = !lyricsExpanded;
                lyricsElement.style.height = lyricsExpanded ? '400px' : '200px';
                lyricsToggleButton.style.transform = lyricsExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            });

            // 初始创建歌曲元素
            const initialSongIndices = getRandomSongIndices(songs, songsPerCircle);
            createSongElements(initialSongIndices);

            // 开始旋转歌曲元素
            rotateSongs();

            // 获取搜索相关元素
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');

            // 搜索功能实现
            function performSearch() {
                const searchTerm = searchInput.value.trim().toLowerCase();
                if (!searchTerm) return;

                // 获取搜索结果容器
                const searchResults = document.getElementById('search-results');
                const searchResultsList = searchResults.querySelector('.search-results__list');
                const searchResultsCount = searchResults.querySelector('.search-results__count');

                // 在现有歌曲列表中搜索
                const matchedSongs = songs.filter(song => 
                    song.name.toLowerCase().includes(searchTerm) ||
                    (song.ar && song.ar.some(artist => artist.name.toLowerCase().includes(searchTerm)))
                );

                // 更新搜索结果数量
                searchResultsCount.textContent = `找到 ${matchedSongs.length} 首歌曲`;
                
                // 清空并更新搜索结果列表
                searchResultsList.innerHTML = '';
                
                if (matchedSongs.length === 0) {
                    searchResultsList.innerHTML = '<div class="search-result-item">未找到匹配的歌曲</div>';
                } else {
                    matchedSongs.forEach(song => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        resultItem.innerHTML = `
                            <div class="search-result-item__cover">
                                <img src="${song.al?.picUrl || 'images/default-cover.jpg'}" alt="${song.name}">
                            </div>
                            <div class="search-result-item__info">
                                <div class="search-result-item__title">${song.name}</div>
                                <div class="search-result-item__artist">${song.ar?.map(artist => artist.name).join(', ') || '未知艺术家'}</div>
                            </div>
                        `;

                        // 点击搜索结果项播放歌曲
                        resultItem.addEventListener('click', () => {
                            const songIndex = songs.indexOf(song);
                            if (songIndex !== -1) {
                                playSong(songIndex);
                                // 点击后关闭搜索结果
                                searchResults.classList.remove('active');
                            }
                        });

                        searchResultsList.appendChild(resultItem);
                    });
                }

                // 显示搜索结果区域
                searchResults.classList.add('active');
            }

            // 绑定搜索按钮点击事件
            searchButton.addEventListener('click', performSearch);

            // 绑定搜索框回车事件
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // 点击其他区域关闭搜索结果
            document.addEventListener('click', (e) => {
                const searchResults = document.getElementById('search-results');
                const searchContainer = document.querySelector('.search-container');
                
                if (!searchResults.contains(e.target) && !searchContainer.contains(e.target)) {
                    searchResults.classList.remove('active');
                }
            });

            // 清空搜索框时隐藏搜索结果
            searchInput.addEventListener('input', () => {
                if (!searchInput.value.trim()) {
                    document.getElementById('search-results').classList.remove('active');
                }
            });

            // 新增随机探索功能
            const diceButton = document.createElement('button');
            diceButton.innerHTML = '🎲';
            diceButton.className = 'dice-button';
            diceButton.addEventListener('click', () => {
                const randomStyle = getRandomStyle();
                applyStyleFilter(randomStyle);
            });

            function getRandomStyle() {
                const styles = ['afro-jazz', 'ambient-house', 'arabic-reggae', 'korean-reggae'];
                return styles[Math.floor(Math.random() * styles.length)];
            }

            function applyStyleFilter(style) {
                // 实现风格过滤逻辑
                console.log(`Applying ${style} filter...`);
            }

            // 添加Web Audio可视化
            function initVisualizer() {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(audioPlayer);
                
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                function renderFrame() {
                    analyser.getByteFrequencyData(dataArray);
                    // 更新可视化效果...
                    requestAnimationFrame(renderFrame);
                }
                renderFrame();
            }

            // 修改loadRecommendations函数
            async function loadRecommendations() {
                try {
                    const response = await fetch('/api/recommend');
                    const data = await response.json();
                    
                    if (!data.playlist?.tracks) {
                        console.error('推荐歌单数据异常');
                        return;
                    }
                    
                    const recommendations = data.playlist.tracks; // 移除 slice 限制，显示所有歌曲
                    const recommendationList = document.querySelector('.recommendation-list');
                    
                    if (!recommendationList) {
                        console.error('推荐列表容器未找到');
                        return;
                    }

                    recommendationList.innerHTML = recommendations.map(song => `
                        <div class="recommendation-card">
                            <div class="card-cover">
                                <img src="${song.al?.picUrl || 'images/default-cover.jpg'}" alt="${song.name}" loading="lazy">
                                <button class="play-button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="card-info">
                                <h4 class="song-title">${song.name}</h4>
                                <p class="song-artist">${song.ar?.map(artist => artist.name).join(', ') || '未知艺术家'}</p>
                                <p class="song-album">${song.al?.name || ''}</p>
                                <div class="song-stats">
                                    <span class="play-count">▶ ${formatPlayCount(song.pop || 0)}</span>
                                    <span class="duration">${formatDuration(song.dt)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    
                    // 添加点击事件
                    document.querySelectorAll('.recommendation-card').forEach((card, index) => {
                        card.addEventListener('click', async () => {
                            try {
                                const song = recommendations[index];
                                const songUrl = await fetchSongUrl(song.id);
                                if (songUrl) {
                                    audioPlayer.src = songUrl;
                                    await audioPlayer.play();
                                    await updateCurrentSongInfo(song);
                                    updatePlayPauseButtonState();
                                }
                            } catch (error) {
                                console.error('播放失败:', error);
                                alert('播放失败，请稍后重试');
                            }
                        });
                    });
                } catch (error) {
                    console.error('加载推荐失败:', error);
                }
            }

            // 格式化播放次数
            function formatPlayCount(count) {
                if (count >= 100000000) {
                    return Math.floor(count / 100000000) + '亿';
                } else if (count >= 10000) {
                    return Math.floor(count / 10000) + '万';
                }
                return count.toString();
            }

            // 格式化时长
            function formatDuration(duration) {
                const minutes = Math.floor((duration / 1000) / 60);
                const seconds = Math.floor((duration / 1000) % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // 在页面加载完成后调用
            loadRecommendations();
        })
        .catch(error => {
            console.error('获取播放列表失败:', error);
            // 确保在发生错误时显示随机默认封面
            songCoverElement.src = getRandomDefaultCover();
        });
});


// 新增缓存策略
const CACHE_NAME = 'music-cache-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        '/',
        '/styles.css',
        '/script.js',
        '/fallback-cover.jpg'
      ]))
  );
});