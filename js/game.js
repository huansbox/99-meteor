/**
 * 全壘打乘法王 - 遊戲主邏輯
 * 負責遊戲流程、計時、獎勵判定、畫面切換
 */

const Game = {
    // 遊戲狀態
    state: {
        screen: 'menu',
        inning: 1,
        batter: 1,
        score: 0,
        stars: 0,
        homeruns: 0,
        currentQuestion: null,
        questions: [],
        questionStartTime: 0,
        isAnswering: false
    },

    // 速度獎勵對照表
    REWARDS: {
        homerun: { maxTime: 2000, bases: 4, stars: 3, name: '全壘打' },
        triple: { maxTime: 4000, bases: 3, stars: 3, name: '三壘安打' },
        double: { maxTime: 6000, bases: 2, stars: 2, name: '二壘安打' },
        single: { maxTime: 10000, bases: 1, stars: 1, name: '一壘安打' },
        walk: { maxTime: Infinity, bases: 1, stars: 1, name: '保送' },
        foul: { bases: 0, stars: 0, name: '界外球' }
    },

    // 音效
    sounds: {
        hit: null,
        cheer: null,
        foul: null
    },

    /**
     * 初始化遊戲
     */
    init() {
        this.bindEvents();
        this.loadSounds();
        this.updateStarsDisplay();
        Animation.init();
    },

    /**
     * 綁定事件
     */
    bindEvents() {
        // 主選單按鈕
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-collection').addEventListener('click', () => this.showScreen('collection'));
        document.getElementById('btn-settings').addEventListener('click', () => this.showScreen('settings'));

        // 返回按鈕
        document.getElementById('btn-back').addEventListener('click', () => this.confirmExit());
        document.getElementById('btn-collection-back').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('btn-settings-back').addEventListener('click', () => this.showScreen('menu'));

        // 答案按鈕
        document.querySelectorAll('.btn-answer').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target));
        });

        // 結算畫面按鈕
        document.getElementById('btn-continue').addEventListener('click', () => this.nextInning());
        document.getElementById('btn-end').addEventListener('click', () => this.endGame());

        // 設定
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            Storage.updateSettings({ soundEnabled: e.target.checked });
        });
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            Storage.updateSettings({ volume: parseInt(e.target.value) });
        });
        document.getElementById('btn-reset').addEventListener('click', () => this.confirmReset());

        // 收藏室分頁
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchCollectionTab(e.target.dataset.tab));
        });
    },

    /**
     * 載入音效
     */
    loadSounds() {
        // 使用 Web Audio API 生成簡單音效
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.createBeepSound = (frequency, duration, type = 'sine') => {
            const settings = Storage.getSettings();
            if (!settings.soundEnabled) return;

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const volume = settings.volume / 100 * 0.3;
            gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        };
    },

    /**
     * 播放音效
     */
    playSound(type) {
        if (!this.createBeepSound) return;

        switch (type) {
            case 'hit':
                this.createBeepSound(600, 0.1, 'square');
                setTimeout(() => this.createBeepSound(800, 0.15, 'square'), 50);
                break;
            case 'homerun':
                this.createBeepSound(523, 0.15);
                setTimeout(() => this.createBeepSound(659, 0.15), 150);
                setTimeout(() => this.createBeepSound(784, 0.3), 300);
                break;
            case 'foul':
                this.createBeepSound(300, 0.2, 'sawtooth');
                break;
            case 'cheer':
                this.createBeepSound(700, 0.1);
                setTimeout(() => this.createBeepSound(880, 0.2), 100);
                break;
        }
    },

    /**
     * 切換畫面
     */
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.state.screen = screenName;

        // 更新收藏室/設定的星星顯示
        if (screenName === 'collection') {
            document.getElementById('collection-stars').textContent = Storage.getPlayer().totalStars;
            this.renderCollection('cards');
        }
    },

    /**
     * 開始遊戲
     */
    startGame() {
        this.state = {
            ...this.state,
            inning: 1,
            batter: 1,
            score: 0,
            stars: 0,
            homeruns: 0,
            questions: Questions.createInning(),
            isAnswering: false
        };

        this.showScreen('game');
        this.updateGameUI();
        Animation.init();

        // 短暫延遲後開始第一題
        setTimeout(() => this.showQuestion(), 500);
    },

    /**
     * 顯示題目
     */
    showQuestion() {
        const questionIndex = this.state.batter - 1;
        this.state.currentQuestion = this.state.questions[questionIndex];

        const q = this.state.currentQuestion;

        // 更新題目顯示
        document.getElementById('num1').textContent = q.num1;
        document.getElementById('num2').textContent = q.num2;

        // 更新選項
        const buttons = document.querySelectorAll('.btn-answer');
        buttons.forEach((btn, i) => {
            btn.textContent = q.options[i];
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });

        // 開始計時
        this.state.questionStartTime = performance.now();
        this.state.isAnswering = true;
    },

    /**
     * 處理答案
     */
    async handleAnswer(button) {
        if (!this.state.isAnswering) return;

        const answerTime = performance.now() - this.state.questionStartTime;
        const selectedAnswer = parseInt(button.textContent);
        const q = this.state.currentQuestion;
        const isCorrect = selectedAnswer === q.answer;

        // 禁用所有按鈕
        this.state.isAnswering = false;
        document.querySelectorAll('.btn-answer').forEach(btn => btn.disabled = true);

        if (isCorrect) {
            button.classList.add('correct');
            await this.handleCorrectAnswer(answerTime);
        } else {
            button.classList.add('wrong');
            await this.handleWrongAnswer();
        }
    },

    /**
     * 處理正確答案
     */
    async handleCorrectAnswer(answerTime) {
        const q = this.state.currentQuestion;
        Questions.recordAnswer(q.questionKey, true);

        // 根據時間判定結果
        let hitType;
        if (answerTime < this.REWARDS.homerun.maxTime) {
            hitType = 'homerun';
            this.state.homeruns++;
        } else if (answerTime < this.REWARDS.triple.maxTime) {
            hitType = 'triple';
        } else if (answerTime < this.REWARDS.double.maxTime) {
            hitType = 'double';
        } else if (answerTime < this.REWARDS.single.maxTime) {
            hitType = 'single';
        } else {
            hitType = 'walk';
        }

        const reward = this.REWARDS[hitType];

        // 播放音效
        if (hitType === 'homerun') {
            this.playSound('homerun');
        } else {
            this.playSound('hit');
        }

        // 播放動畫
        await Animation.playHit(hitType);

        // 更新分數
        this.state.score += reward.bases;
        this.state.stars += reward.stars;

        // 顯示結果
        this.showResult(reward.name, reward.stars);

        // 延遲後進入下一題或結算
        setTimeout(() => this.nextBatter(), 1500);
    },

    /**
     * 處理錯誤答案
     */
    async handleWrongAnswer() {
        const q = this.state.currentQuestion;
        Questions.recordAnswer(q.questionKey, false);

        this.playSound('foul');
        await Animation.playHit('foul');

        // 顯示結果
        this.showResult('界外球', 0, '再試一次!');

        // 延遲後允許重新作答
        setTimeout(() => {
            document.querySelectorAll('.btn-answer').forEach(btn => {
                btn.classList.remove('wrong');
                btn.disabled = false;
            });
            this.state.isAnswering = true;
        }, 1000);
    },

    /**
     * 顯示打擊結果
     */
    showResult(text, stars, subtitle = '') {
        const display = document.getElementById('result-display');
        display.querySelector('.result-text').textContent = text;
        display.querySelector('.result-stars').textContent = '⭐'.repeat(stars) || subtitle;
        display.classList.remove('hidden');

        // 自動隱藏
        setTimeout(() => display.classList.add('hidden'), 1200);
    },

    /**
     * 下一位打者
     */
    nextBatter() {
        document.getElementById('result-display').classList.add('hidden');

        if (this.state.batter < 3) {
            this.state.batter++;
            this.updateGameUI();
            this.showQuestion();
        } else {
            this.showInningResult();
        }
    },

    /**
     * 顯示局結算
     */
    showInningResult() {
        document.getElementById('inning-score').textContent = this.state.score;
        document.getElementById('inning-stars').textContent = `⭐ ${this.state.stars}`;
        document.getElementById('homerun-count').textContent = this.state.homeruns;

        // 儲存星星
        Storage.addStars(this.state.stars);
        const player = Storage.getPlayer();
        Storage.updatePlayer({
            gamesPlayed: player.gamesPlayed + 1,
            totalHomeruns: player.totalHomeruns + this.state.homeruns
        });

        this.showScreen('result');
    },

    /**
     * 下一局
     */
    nextInning() {
        this.state.inning++;
        this.state.batter = 1;
        this.state.score = 0;
        this.state.stars = 0;
        this.state.homeruns = 0;
        this.state.questions = Questions.createInning();

        this.showScreen('game');
        this.updateGameUI();
        Animation.init();

        setTimeout(() => this.showQuestion(), 500);
    },

    /**
     * 結束遊戲
     */
    endGame() {
        this.updateStarsDisplay();
        this.showScreen('menu');
    },

    /**
     * 更新遊戲 UI
     */
    updateGameUI() {
        document.getElementById('current-inning').textContent = this.state.inning;
        document.getElementById('current-batter').textContent = this.state.batter;
        document.getElementById('game-stars').textContent = this.state.stars;
    },

    /**
     * 更新主選單星星顯示
     */
    updateStarsDisplay() {
        const player = Storage.getPlayer();
        document.getElementById('total-stars').textContent = player.totalStars;
    },

    /**
     * 確認離開遊戲
     */
    confirmExit() {
        if (confirm('確定要離開遊戲嗎？本局進度將不會保存。')) {
            this.showScreen('menu');
        }
    },

    /**
     * 確認重置進度
     */
    confirmReset() {
        if (confirm('確定要重置所有進度嗎？此操作無法復原。')) {
            Storage.resetAll();
            this.updateStarsDisplay();
            alert('進度已重置');
        }
    },

    /**
     * 切換收藏室分頁
     */
    switchCollectionTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        this.renderCollection(tab);
    },

    /**
     * 渲染收藏品
     */
    renderCollection(type) {
        const container = document.getElementById('collection-content');
        const collection = Storage.getCollection();

        const items = {
            cards: [
                { id: 'speed_king', name: '速算王', icon: '👑', unlock: 'homeruns >= 10' },
                { id: 'x2_master', name: '×2 大師', icon: '2️⃣', unlock: 'master x2' },
                { id: 'x5_master', name: '×5 大師', icon: '5️⃣', unlock: 'master x5' },
                { id: 'x7_master', name: '×7 大師', icon: '7️⃣', unlock: 'master x7' },
                { id: 'x9_master', name: '×9 大師', icon: '9️⃣', unlock: 'master x9' },
                { id: 'perfect', name: '完美打擊', icon: '⭐', unlock: 'all homerun in inning' }
            ],
            items: [
                { id: 'wooden', name: '木棒', icon: '🏏', unlock: 'default' },
                { id: 'metal', name: '金屬棒', icon: '⚾', unlock: 'stars >= 50' },
                { id: 'golden', name: '黃金棒', icon: '✨', unlock: 'stars >= 200' }
            ]
        };

        const typeKey = type === 'cards' ? 'playerCards' : 'bats';
        const ownedItems = collection[typeKey] || [];

        container.innerHTML = items[type].map(item => {
            const owned = ownedItems.includes(item.id);
            return `
                <div class="collection-item ${owned ? '' : 'locked'}">
                    <span class="icon">${item.icon}</span>
                    <span class="name">${item.name}</span>
                </div>
            `;
        }).join('');
    }
};

// 頁面載入後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
