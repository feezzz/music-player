// 监听 DOM 加载完成事件
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
            function rotateSongs() {
                rotationAngle += 0.001;
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
            function updateCurrentSongInfo(song) {
                if (!song) return;
                
                currentSongElement.textContent = song.name;
                currentArtistElement.textContent = song.ar ? song.ar.map(artist => artist.name).join(', ') : '-';
                
                // 更新封面图片，如果没有封面则使用随机默认封面
                if (song.al && song.al.picUrl) {
                    songCoverElement.src = song.al.picUrl;
                } else {
                    songCoverElement.src = getRandomDefaultCover(); // 每次使用新的随机封面
                }

                // 添加错误处理，如果封面加载失败则使用随机默认封面
                songCoverElement.onerror = () => {
                    songCoverElement.src = getRandomDefaultCover(); // 加载失败时也使用新的随机封面
                };
            }

            // 播放指定歌曲
            async function playSong(index) {
                if (index < 0 || !songs[index]) return;

                currentSongIndex = index;
                const currentSong = songs[index];

                try {
                    const songUrl = await fetchSongUrl(currentSong.id);
                    if (songUrl) {
                        audioPlayer.src = songUrl;
                        // 更新歌曲信息
                        updateCurrentSongInfo(currentSong);
                        // 立即播放
                        await audioPlayer.play();
                        updatePlayPauseButtonState();
                    } else {
                        throw new Error('无法获取歌曲URL');
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
            async function fetchSongUrl(songId) {
                try {
                    const response = await fetch(`http://localhost:3000/song/url?id=${songId}`);
                    const data = await response.json();
                    if (data && data.data && data.data[0] && data.data[0].url) {
                        return data.data[0].url; // 返回歌曲 URL
                    } else {
                        console.error('Song URL not found');
                        return null;
                    }
                } catch (error) {
                    console.error('Error fetching song URL:', error);
                    return null;
                }
            }

            // 初始创建歌曲元素
            const initialSongIndices = getRandomSongIndices(songs, songsPerCircle);
            createSongElements(initialSongIndices);

            // 开始旋转歌曲元素
            rotateSongs();
        })
        .catch(error => {
            console.error('获取播放列表失败:', error);
            // 确保在发生错误时显示随机默认封面
            songCoverElement.src = getRandomDefaultCover();
        });
});