/**
 * 全壘打乘法王 - Canvas 動畫系統
 * 負責棒球場渲染與打擊動畫
 */

const Animation = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    animationId: null,

    // 動畫狀態
    state: {
        phase: 'idle',  // idle, pitching, hitting, running
        ballX: 0,
        ballY: 0,
        ballScale: 1,
        batterSwing: 0,
        runnerPositions: [],
        hitType: null,
        hitProgress: 0
    },

    // 顏色配置
    colors: {
        grass: '#4CAF50',
        dirt: '#8B5A2B',
        base: '#FFFFFF',
        ball: '#FFFFFF',
        player: '#1976D2'
    },

    /**
     * 初始化 Canvas
     */
    init() {
        this.canvas = document.getElementById('baseball-field');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.resetState();
        this.draw();
    },

    /**
     * 調整 Canvas 大小
     */
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 設定實際像素大小（考慮設備像素比）
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.scale(dpr, dpr);

        // 重新繪製
        this.draw();
    },

    /**
     * 重置動畫狀態
     */
    resetState() {
        this.state = {
            phase: 'idle',
            ballX: this.width * 0.5,
            ballY: this.height * 0.3,
            ballScale: 1,
            batterSwing: 0,
            runnerPositions: [],
            hitType: null,
            hitProgress: 0
        };
    },

    /**
     * 繪製場景
     */
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 清空畫布
        ctx.clearRect(0, 0, w, h);

        // 繪製草地背景
        ctx.fillStyle = this.colors.grass;
        ctx.fillRect(0, 0, w, h);

        // 繪製內野土地（菱形）
        const centerX = w * 0.5;
        const centerY = h * 0.6;
        const diamondSize = Math.min(w, h) * 0.35;

        ctx.fillStyle = this.colors.dirt;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - diamondSize);  // 二壘
        ctx.lineTo(centerX + diamondSize, centerY);   // 一壘
        ctx.lineTo(centerX, centerY + diamondSize);   // 本壘
        ctx.lineTo(centerX - diamondSize, centerY);   // 三壘
        ctx.closePath();
        ctx.fill();

        // 繪製壘包
        this.drawBase(centerX, centerY - diamondSize * 0.7, false);  // 二壘
        this.drawBase(centerX + diamondSize * 0.7, centerY, false);  // 一壘
        this.drawBase(centerX - diamondSize * 0.7, centerY, false);  // 三壘
        this.drawHomePlate(centerX, centerY + diamondSize * 0.7);     // 本壘

        // 繪製打者
        this.drawBatter(centerX + 30, centerY + diamondSize * 0.7);

        // 繪製投手
        this.drawPitcher(centerX, centerY);

        // 繪製球
        if (this.state.phase !== 'idle' || this.state.ballScale > 0) {
            this.drawBall(this.state.ballX, this.state.ballY, this.state.ballScale);
        }

        // 繪製跑者
        this.state.runnerPositions.forEach(pos => {
            this.drawRunner(pos.x, pos.y);
        });
    },

    /**
     * 繪製壘包
     */
    drawBase(x, y, occupied) {
        const ctx = this.ctx;
        const size = 12;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);

        ctx.fillStyle = occupied ? '#FFD700' : '#FFFFFF';
        ctx.fillRect(-size / 2, -size / 2, size, size);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        ctx.restore();
    },

    /**
     * 繪製本壘板
     */
    drawHomePlate(x, y) {
        const ctx = this.ctx;
        const size = 16;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.6, y + size);
        ctx.lineTo(x - size * 0.6, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    /**
     * 繪製打者（簡化圓形 + 球棒）
     */
    drawBatter(x, y) {
        const ctx = this.ctx;

        // 身體
        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.arc(x, y - 20, 12, 0, Math.PI * 2);
        ctx.fill();

        // 球棒（根據揮棒角度）
        ctx.save();
        ctx.translate(x, y - 20);
        ctx.rotate(-Math.PI / 4 + this.state.batterSwing);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, -3, 35, 6);

        ctx.restore();
    },

    /**
     * 繪製投手
     */
    drawPitcher(x, y) {
        const ctx = this.ctx;

        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.arc(x, y - 20, 10, 0, Math.PI * 2);
        ctx.fill();
    },

    /**
     * 繪製跑者
     */
    drawRunner(x, y) {
        const ctx = this.ctx;

        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    },

    /**
     * 繪製球
     */
    drawBall(x, y, scale = 1) {
        const ctx = this.ctx;
        const radius = 8 * scale;

        ctx.fillStyle = this.colors.ball;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    /**
     * 播放打擊動畫
     * @param {string} hitType - homerun, triple, double, single, walk, foul
     * @returns {Promise}
     */
    playHit(hitType) {
        return new Promise((resolve) => {
            this.state.phase = 'hitting';
            this.state.hitType = hitType;
            this.state.hitProgress = 0;
            this.state.batterSwing = 0;

            const startTime = performance.now();
            const duration = hitType === 'homerun' ? 1500 : 1000;

            const centerX = this.width * 0.5;
            const centerY = this.height * 0.6;
            const diamondSize = Math.min(this.width, this.height) * 0.35;

            // 球的起始位置（投手）
            const startX = centerX;
            const startY = centerY;

            // 球的終點位置（依打擊結果）
            let endX, endY, endScale;
            switch (hitType) {
                case 'homerun':
                    endX = centerX;
                    endY = -50;
                    endScale = 0.2;
                    break;
                case 'triple':
                    endX = centerX - diamondSize * 1.2;
                    endY = centerY - diamondSize * 0.5;
                    endScale = 0.5;
                    break;
                case 'double':
                    endX = centerX + diamondSize;
                    endY = centerY - diamondSize * 0.3;
                    endScale = 0.6;
                    break;
                case 'single':
                    endX = centerX + diamondSize * 0.5;
                    endY = centerY + diamondSize * 0.2;
                    endScale = 0.8;
                    break;
                case 'walk':
                    // 保送：球不動，打者直接上壘
                    endX = startX;
                    endY = startY;
                    endScale = 1;
                    break;
                case 'foul':
                    endX = this.width + 50;
                    endY = centerY;
                    endScale = 0.5;
                    break;
                default:
                    endX = centerX + diamondSize * 0.5;
                    endY = centerY;
                    endScale = 0.7;
            }

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 緩動函數
                const easeOut = 1 - Math.pow(1 - progress, 3);

                // 更新球位置
                this.state.ballX = startX + (endX - startX) * easeOut;
                this.state.ballY = startY + (endY - startY) * easeOut;
                if (hitType === 'homerun') {
                    // 全壘打：拋物線
                    const parabola = -4 * progress * (progress - 1);
                    this.state.ballY -= parabola * 100;
                }
                this.state.ballScale = 1 + (endScale - 1) * easeOut;

                // 更新揮棒角度
                if (progress < 0.3 && hitType !== 'walk') {
                    this.state.batterSwing = (progress / 0.3) * Math.PI * 0.7;
                }

                this.draw();

                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.state.phase = 'idle';
                    this.resetState();
                    this.draw();
                    resolve();
                }
            };

            this.animationId = requestAnimationFrame(animate);
        });
    },

    /**
     * 停止動畫
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};
