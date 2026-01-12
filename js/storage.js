/**
 * 全壘打乘法王 - 存檔系統
 * 使用 localStorage 管理玩家進度與設定
 */

const Storage = {
    KEYS: {
        PLAYER: 'mathBaseball_player',
        PROGRESS: 'mathBaseball_progress',
        WRONG_QUESTIONS: 'mathBaseball_wrongQuestions',
        SETTINGS: 'mathBaseball_settings',
        COLLECTION: 'mathBaseball_collection'
    },

    // 預設資料結構
    defaults: {
        player: {
            name: '打擊手',
            totalStars: 0,
            gamesPlayed: 0,
            totalHomeruns: 0
        },
        progress: {
            currentLevel: 1,
            masteredMultipliers: [],
            stats: {
                totalQuestions: 0,
                correctAnswers: 0,
                fastAnswers: 0  // < 2秒
            }
        },
        wrongQuestions: {},
        settings: {
            soundEnabled: true,
            volume: 50
        },
        collection: {
            playerCards: [],
            bats: ['wooden'],
            jerseys: ['default'],
            equippedBat: 'wooden',
            equippedJersey: 'default'
        }
    },

    /**
     * 取得資料
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    /**
     * 儲存資料
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    /**
     * 初始化存檔（首次執行時建立預設資料）
     */
    init() {
        Object.entries(this.KEYS).forEach(([name, key]) => {
            const defaultKey = name.toLowerCase();
            if (!this.get(key) && this.defaults[defaultKey]) {
                this.set(key, this.defaults[defaultKey]);
            }
        });
    },

    /**
     * 取得玩家資料
     */
    getPlayer() {
        return this.get(this.KEYS.PLAYER) || this.defaults.player;
    },

    /**
     * 更新玩家資料
     */
    updatePlayer(updates) {
        const player = this.getPlayer();
        const updated = { ...player, ...updates };
        this.set(this.KEYS.PLAYER, updated);
        return updated;
    },

    /**
     * 增加星星
     */
    addStars(count) {
        const player = this.getPlayer();
        player.totalStars += count;
        this.set(this.KEYS.PLAYER, player);
        return player.totalStars;
    },

    /**
     * 取得錯題記錄
     */
    getWrongQuestions() {
        return this.get(this.KEYS.WRONG_QUESTIONS) || {};
    },

    /**
     * 記錄答錯的題目
     */
    recordWrongAnswer(questionKey) {
        const wrong = this.getWrongQuestions();
        if (!wrong[questionKey]) {
            wrong[questionKey] = { wrongCount: 0, correctStreak: 0 };
        }
        wrong[questionKey].wrongCount++;
        wrong[questionKey].correctStreak = 0;
        wrong[questionKey].lastWrong = new Date().toISOString();
        this.set(this.KEYS.WRONG_QUESTIONS, wrong);
    },

    /**
     * 記錄答對的題目（用於錯題機制）
     */
    recordCorrectAnswer(questionKey) {
        const wrong = this.getWrongQuestions();
        if (wrong[questionKey]) {
            wrong[questionKey].correctStreak++;
            // 連續答對 3 次後移出錯題庫
            if (wrong[questionKey].correctStreak >= 3) {
                delete wrong[questionKey];
            }
            this.set(this.KEYS.WRONG_QUESTIONS, wrong);
        }
    },

    /**
     * 取得設定
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || this.defaults.settings;
    },

    /**
     * 更新設定
     */
    updateSettings(updates) {
        const settings = this.getSettings();
        const updated = { ...settings, ...updates };
        this.set(this.KEYS.SETTINGS, updated);
        return updated;
    },

    /**
     * 取得收藏
     */
    getCollection() {
        return this.get(this.KEYS.COLLECTION) || this.defaults.collection;
    },

    /**
     * 解鎖收藏品
     */
    unlockItem(type, itemId) {
        const collection = this.getCollection();
        if (!collection[type].includes(itemId)) {
            collection[type].push(itemId);
            this.set(this.KEYS.COLLECTION, collection);
        }
        return collection;
    },

    /**
     * 重置所有進度
     */
    resetAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};

// 初始化存檔
Storage.init();
