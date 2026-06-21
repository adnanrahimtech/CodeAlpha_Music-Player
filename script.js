(function() {
    // ---------- SONG DATABASE ----------
    const songs = [
        { title: 'Midnight Waves', artist: 'Luna Echo', duration: '3:42', cover: 'https://picsum.photos/seed/midnight/400/400' },
        { title: 'Neon Glow', artist: 'Aurora Flux', duration: '4:15', cover: 'https://picsum.photos/seed/neon/400/400' },
        { title: 'Echo Park', artist: 'Lost Frequencies', duration: '3:08', cover: 'https://picsum.photos/seed/echo/400/400' },
        { title: 'Horizon Drive', artist: 'Kai Silva', duration: '5:22', cover: 'https://picsum.photos/seed/horizon/400/400' },
        { title: 'Solar Flare', artist: 'Nova Echo', duration: '4:48', cover: 'https://picsum.photos/seed/solar/400/400' }
    ];

    // ---------- DOM REFS ----------
    const coverArt = document.getElementById('coverArt');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressFill = document.getElementById('progressFill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const playlistContainer = document.getElementById('playlistContainer');
    const trackCount = document.getElementById('trackCount');
    const likeIcon = document.getElementById('likeIcon');
    const shuffleIcon = document.getElementById('shuffleIcon');
    const loopIcon = document.getElementById('loopIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');

    // ---------- AUDIO ----------
    const audio = new Audio();

    // ---------- STATE ----------
    let currentIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isLoop = false;
    let isLiked = false;
    let updateInterval = null;
    let shuffleQueue = [];

    // ---------- HELPERS ----------
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // ---------- LOAD TRACK ----------
    function loadTrack(index) {
        if (index < 0) index = songs.length - 1;
        if (index >= songs.length) index = 0;
        currentIndex = index;

        const song = songs[currentIndex];
        // Using SoundHelix demo MP3s (public domain)
        audio.src = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(currentIndex % 10) + 1}.mp3`;
        audio.load();

        // Update UI
        coverArt.src = song.cover;
        trackTitle.textContent = song.title;
        trackArtist.textContent = song.artist;
        totalTimeEl.textContent = song.duration;

        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';

        // Highlight playlist
        document.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === currentIndex);
        });

        // If playing, resume
        if (isPlaying) {
            audio.play().catch(() => {});
        }
    }

    // ---------- PLAY / PAUSE ----------
    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
        } else {
            audio.play().catch(() => {});
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(updateProgress, 200);
        }
    }

    // ---------- UPDATE PROGRESS ----------
    function updateProgress() {
        if (!audio.duration || isNaN(audio.duration)) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = Math.min(percent, 100) + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }

    // ---------- SET PROGRESS (click on bar) ----------
    function setProgress(e) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (width <= 0) return;
        const percent = Math.min(Math.max(clickX / width, 0), 1);
        if (audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = percent * audio.duration;
            progressFill.style.width = (percent * 100) + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    }

    // ---------- GET NEXT INDEX (with shuffle) ----------
    function getNextIndex() {
        if (isShuffle) {
            // Build shuffle queue if empty
            if (shuffleQueue.length === 0) {
                const indices = Array.from({ length: songs.length }, (_, i) => i);
                // Remove current index from queue
                const filtered = indices.filter(i => i !== currentIndex);
                // Shuffle
                for (let i = filtered.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
                }
                shuffleQueue = filtered;
            }
            return shuffleQueue.pop();
        } else {
            let next = currentIndex + 1;
            if (next >= songs.length) next = 0;
            return next;
        }
    }

    // ---------- NEXT / PREV ----------
    function nextTrack() {
        const nextIdx = getNextIndex();
        loadTrack(nextIdx);
        if (isPlaying) {
            audio.play().catch(() => {});
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        if (updateInterval) clearInterval(updateInterval);
        if (isPlaying) {
            updateInterval = setInterval(updateProgress, 200);
        }
    }

    function prevTrack() {
        // If shuffle is on, prev behaves like previous in queue or random
        if (isShuffle) {
            // Simple: go to a random previous track (not same)
            let prevIdx;
            do {
                prevIdx = Math.floor(Math.random() * songs.length);
            } while (prevIdx === currentIndex && songs.length > 1);
            loadTrack(prevIdx);
        } else {
            let prevIdx = currentIndex - 1;
            if (prevIdx < 0) prevIdx = songs.length - 1;
            loadTrack(prevIdx);
        }
        if (isPlaying) {
            audio.play().catch(() => {});
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        if (updateInterval) clearInterval(updateInterval);
        if (isPlaying) {
            updateInterval = setInterval(updateProgress, 200);
        }
    }

    // ---------- RENDER PLAYLIST ----------
    function renderPlaylist() {
        playlistContainer.innerHTML = '';
        songs.forEach((song, idx) => {
            const div = document.createElement('div');
            div.className = `playlist-item ${idx === currentIndex ? 'active' : ''}`;
            div.innerHTML = `
                <span class="item-index">${String(idx + 1).padStart(2, '0')}</span>
                <div class="item-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
                <span class="item-duration">${song.duration}</span>
            `;
            div.addEventListener('click', () => {
                if (idx === currentIndex) {
                    // Same track: restart
                    audio.currentTime = 0;
                    progressFill.style.width = '0%';
                    currentTimeEl.textContent = '0:00';
                    if (!isPlaying) togglePlay();
                } else {
                    // Clear shuffle queue when manually selecting
                    shuffleQueue = [];
                    loadTrack(idx);
                    if (!isPlaying) togglePlay();
                    else {
                        audio.play().catch(() => {});
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        if (updateInterval) clearInterval(updateInterval);
                        updateInterval = setInterval(updateProgress, 200);
                    }
                }
            });
            playlistContainer.appendChild(div);
        });
        trackCount.textContent = `${songs.length} tracks`;
    }

    // ---------- VOLUME ----------
    volumeSlider.addEventListener('input', function() {
        const val = parseFloat(this.value);
        audio.volume = val;
        // Update volume icon
        if (val === 0) volumeIcon.className = 'fas fa-volume-mute';
        else if (val < 0.5) volumeIcon.className = 'fas fa-volume-down';
        else volumeIcon.className = 'fas fa-volume-up';
    });

    // ---------- INIT ----------
    function init() {
        // Set initial volume
        audio.volume = parseFloat(volumeSlider.value);

        // Load first track
        loadTrack(0);
        renderPlaylist();

        // Default icons
        loopIcon.classList.remove('active-icon');
        shuffleIcon.classList.remove('active-icon');
        likeIcon.classList.remove('active-icon');
        likeIcon.style.color = '';
        audio.loop = false;

        // Set total time fallback
        setTimeout(() => {
            if (audio.duration) {
                totalTimeEl.textContent = formatTime(audio.duration);
            } else {
                totalTimeEl.textContent = songs[0].duration;
            }
        }, 150);

        // ---------- EVENT LISTENERS ----------
        playBtn.addEventListener('click', togglePlay);

        prevBtn.addEventListener('click', () => {
            if (audio.currentTime > 2) {
                audio.currentTime = 0;
                progressFill.style.width = '0%';
                currentTimeEl.textContent = '0:00';
            } else {
                prevTrack();
            }
        });

        nextBtn.addEventListener('click', nextTrack);

        progressBar.addEventListener('click', setProgress);

        // Loop
        loopIcon.addEventListener('click', function() {
            isLoop = !isLoop;
            audio.loop = isLoop;
            this.classList.toggle('active-icon', isLoop);
        });

        // Shuffle
        shuffleIcon.addEventListener('click', function() {
            isShuffle = !isShuffle;
            this.classList.toggle('active-icon', isShuffle);
            // Reset shuffle queue when toggling on/off
            shuffleQueue = [];
        });

        // Like
        likeIcon.addEventListener('click', function() {
            isLiked = !isLiked;
            this.classList.toggle('active-icon', isLiked);
        });

        // Audio ended → autoplay next (or loop)
        audio.addEventListener('ended', function() {
            if (isLoop) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
                return;
            }
            nextTrack();
        });

        // Error fallback: if MP3 fails, keep UI consistent
        audio.addEventListener('error', function() {
            if (!audio.duration || isNaN(audio.duration)) {
                const parts = songs[currentIndex].duration.split(':');
                const fakeSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                audio.duration = fakeSecs;
                totalTimeEl.textContent = songs[currentIndex].duration;
                if (!updateInterval && isPlaying) {
                    updateInterval = setInterval(updateProgress, 200);
                }
            }
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (updateInterval) clearInterval(updateInterval);
        });
    }

    init();

})();
