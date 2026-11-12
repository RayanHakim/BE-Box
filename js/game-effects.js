(function () {
    "use strict";

    // Each note contains its start time, frequency, duration, and volume.
    const cues = {
        click: [[0, 820, 0.055, 0.13], [0.012, 1160, 0.045, 0.055]],
        open: [[0, 220, 0.07, 0.09], [0.07, 370, 0.12, 0.06]],
        correct: [
            [0, 523, 0.16, 0.19], [0.10, 659, 0.17, 0.19],
            [0.20, 784, 0.18, 0.19], [0.30, 1047, 0.29, 0.22], [0.30, 1568, 0.22, 0.07]
        ],
        wrong: [[0, 330, 0.19, 0.20], [0.17, 220, 0.26, 0.20]],
        tick: [[0, 1100, 0.06, 0.105]],
        tickUrgent: [[0, 1320, 0.075, 0.16], [0.105, 1320, 0.075, 0.13]],
        timeout: [[0, 440, 0.14, 0.21], [0.19, 440, 0.14, 0.21], [0.38, 294, 0.36, 0.23]],
        lucky: [[0, 784, 0.14, 0.09], [0.07, 1047, 0.17, 0.09], [0.14, 1319, 0.23, 0.08]],
        bomb: [[0, 85, 0.33, 0.19]],
        unlucky: [[0, 330, 0.14, 0.13], [0.12, 247, 0.21, 0.14]],
        double: [[0, 440, 0.18, 0.10], [0.12, 880, 0.25, 0.10]],
        empty: [[0, 225, 0.10, 0.08]],
        leaderboard: [[0, 392, 0.14, 0.15], [0.15, 494, 0.14, 0.16], [0.30, 587, 0.31, 0.17]],
        leader: [
            [0, 392, 0.14, 0.15], [0.15, 494, 0.14, 0.16], [0.30, 587, 0.23, 0.17],
            [0.58, 784, 0.38, 0.18], [0.58, 494, 0.38, 0.09], [0.58, 392, 0.38, 0.08],
            [1.19, 784, 0.39, 0.15], [1.19, 587, 0.39, 0.10], [1.19, 392, 0.39, 0.08]
        ],
        next: [[0, 280, 0.08, 0.075], [0.10, 415, 0.10, 0.07]],
        finish: [[0, 523, 0.22, 0.10], [0.16, 659, 0.22, 0.10], [0.32, 784, 0.25, 0.10], [0.53, 1047, 0.74, 0.11]]
    };

    const pops = {
        open: [[0, 0.05, 0.065]],
        empty: [[0, 0.09, 0.075]],
        bomb: [[0, 0.18, 0.15]],
        leader: [[0.58, 0.11, 0.16], [1.19, 0.13, 0.15]]
    };

    const waveforms = { wrong: "triangle", timeout: "triangle" };

    let context;
    let noiseBuffer;
    let trumpetWave;
    const sources = new Set();
    const music = document.getElementById("gameMusic");
    const soundToggle = document.getElementById("gameMusicToggle");
    const tracks = {
        menu: "assets/menu-background.wav",
        game: "assets/game-background.wav",
        "quiz-easy": "assets/quiz-easy.wav",
        "quiz-medium": "assets/quiz-medium.wav",
        "quiz-hard": "assets/quiz-hard.wav",
        results: "assets/results-background.wav"
    };
    const menuPositionKey = "mb_menu_music_position";
    let currentTrack = "menu";
    let gamePosition = 0;
    let activated = sessionStorage.getItem(menuPositionKey) !== null;
    let enabled = MBStorage.getMusicEnabled();

    function unlock() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            context ??= new AudioContext();
            if (context.state !== "running") context.resume().catch(() => {});
        } catch {
            // The game can continue when audio is unavailable.
        }
    }

    function stop() {
        for (const source of sources) source.stop();
        sources.clear();
    }

    function startVoice(source, start, duration, volume, sustained = false) {
        const gain = context.createGain();
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.012);
        if (sustained) {
            gain.gain.linearRampToValueAtTime(volume * 0.68, start + duration - 0.065);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        source.connect(gain);
        gain.connect(context.destination);
        sources.add(source);
        source.onended = () => {
            sources.delete(source);
            source.disconnect();
            gain.disconnect();
        };
        source.start(start);
        source.stop(start + duration);
    }

    function play(cue) {
        if (!enabled || document.hidden || !context || !cues[cue]) return;
        if (cue !== "click") stop();
        const start = context.currentTime;
        const useTrumpet = cue === "leaderboard" || cue === "leader";
        if (useTrumpet && !trumpetWave) {
            const harmonics = new Float32Array([0, 1, 0.70, 0.43, 0.24, 0.12, 0.09, 0.045]);
            trumpetWave = context.createPeriodicWave(new Float32Array(harmonics.length), harmonics);
        }

        for (const [delay, frequency, duration, volume] of cues[cue]) {
            const oscillator = context.createOscillator();
            if (useTrumpet) oscillator.setPeriodicWave(trumpetWave);
            else oscillator.type = waveforms[cue] ?? "sine";
            oscillator.frequency.value = frequency;
            startVoice(oscillator, start + delay, duration, volume, useTrumpet);
        }

        for (const [delay, duration, volume] of pops[cue] ?? []) {
            if (!noiseBuffer) {
                noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.2), context.sampleRate);
                const samples = noiseBuffer.getChannelData(0);
                for (let index = 0; index < samples.length; index++) {
                    samples[index] = Math.random() * 2 - 1;
                }
            }
            const noise = context.createBufferSource();
            noise.buffer = noiseBuffer;
            startVoice(noise, start + delay, duration, volume);
        }
    }

    function updateToggle() {
        soundToggle.setAttribute("aria-pressed", String(enabled));
        soundToggle.title = enabled ? "Matikan suara" : "Aktifkan suara";
    }

    function syncMusic() {
        if (!enabled || document.hidden) {
            music.pause();
            stop();
        } else if (activated && music.paused) {
            music.play().catch(() => {});
        }
    }

    function saveMenuPosition() {
        if (activated && currentTrack === "menu") {
            sessionStorage.setItem(menuPositionKey, String(music.currentTime));
        }
    }

    function restoreMenuPosition() {
        if (currentTrack !== "menu") return;
        const position = sessionStorage.getItem(menuPositionKey);
        if (position !== null) {
            activated = true;
            music.currentTime = Number(position) || 0;
        }
    }

    function setMusic(track) {
        if (!Object.hasOwn(tracks, track)) track = "game";
        if (track === currentTrack) return;
        saveMenuPosition();
        if (currentTrack === "game") gamePosition = music.currentTime;
        if (track === "menu" || track === "results") gamePosition = 0;

        music.pause();
        currentTrack = track;
        music.src = tracks[track];
        if (track === "game") music.currentTime = gamePosition;
        else restoreMenuPosition();
        syncMusic();
    }

    function activate() {
        activated = true;
        unlock();
        syncMusic();
    }

    document.addEventListener("click", event => {
        if (event.target.closest("#gameMusicToggle")) {
            enabled = !enabled;
            MBStorage.saveMusicEnabled(enabled);
            updateToggle();
            if (!enabled) {
                syncMusic();
                return;
            }
        }

        if (!enabled) return;
        activate();
        const control = event.target.closest("button:not(:disabled), a[href]");
        if (control && !control.matches(".mystery-box, .quiz-option")) play("click");
    }, true);

    document.addEventListener("visibilitychange", syncMusic);
    window.addEventListener("pageshow", event => {
        if (event.persisted) restoreMenuPosition();
        syncMusic();
    });
    window.addEventListener("pagehide", () => {
        saveMenuPosition();
        music.pause();
        stop();
    });
    window.addEventListener("storage", event => {
        if (event.key === MBStorage.STORAGE_KEYS.MUSIC_ENABLED || event.key === null) {
            enabled = MBStorage.getMusicEnabled();
            updateToggle();
            syncMusic();
        }
    });

    restoreMenuPosition();
    updateToggle();
    syncMusic();
    window.MBEffects = { play, stop, setMusic };
})();
