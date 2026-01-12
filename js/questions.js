/**
 * 全壘打乘法王 - 題庫系統
 * 負責生成題目、錯題權重、干擾選項
 */

const Questions = {
    // 難度分級
    EASY_MULTIPLIERS: [1, 2, 5, 10],
    NORMAL_MULTIPLIERS: [3, 4, 6, 7, 8, 9],

    // 出題比例
    EASY_RATIO: 1 / 3,
    WRONG_WEIGHT: 3,  // 錯題權重倍數

    /**
     * 生成一道題目
     * @returns {Object} { num1, num2, answer, questionKey }
     */
    generate() {
        const wrongQuestions = Storage.getWrongQuestions();
        const wrongKeys = Object.keys(wrongQuestions);

        // 決定是否從錯題庫抽題
        let num1, num2;
        if (wrongKeys.length > 0 && Math.random() < 0.4) {
            // 40% 機率從錯題庫抽題
            const randomWrong = wrongKeys[Math.floor(Math.random() * wrongKeys.length)];
            [num1, num2] = randomWrong.split('x').map(Number);
        } else {
            // 依比例從一般題庫抽題
            const isEasy = Math.random() < this.EASY_RATIO;
            const multipliers = isEasy ? this.EASY_MULTIPLIERS : this.NORMAL_MULTIPLIERS;

            num1 = Math.floor(Math.random() * 9) + 1;  // 1-9
            num2 = multipliers[Math.floor(Math.random() * multipliers.length)];

            // 隨機交換 num1 和 num2（讓題目更多樣）
            if (Math.random() < 0.5) {
                [num1, num2] = [num2, num1];
            }
        }

        return {
            num1,
            num2,
            answer: num1 * num2,
            questionKey: `${num1}x${num2}`
        };
    },

    /**
     * 生成四個選項（含正確答案）
     * @param {number} correctAnswer 正確答案
     * @param {number} num1 第一個數字
     * @param {number} num2 第二個數字
     * @returns {Array} 四個選項（已隨機排列）
     */
    generateOptions(correctAnswer, num1, num2) {
        const options = new Set([correctAnswer]);

        // 干擾選項策略
        const distractors = [
            correctAnswer + 1,                    // 正答 +1
            correctAnswer - 1,                    // 正答 -1
            correctAnswer + 2,                    // 正答 +2
            correctAnswer - 2,                    // 正答 -2
            num1 * (num2 + 1),                   // 乘數 +1
            num1 * (num2 - 1),                   // 乘數 -1
            (num1 + 1) * num2,                   // 被乘數 +1
            (num1 - 1) * num2,                   // 被乘數 -1
            correctAnswer + 10,                  // +10 誤算
            correctAnswer - 10,                  // -10 誤算
        ];

        // 打亂干擾選項順序
        this.shuffle(distractors);

        // 選取三個有效的干擾選項
        for (const d of distractors) {
            if (options.size >= 4) break;
            if (d > 0 && d <= 90 && d !== correctAnswer && !options.has(d)) {
                options.add(d);
            }
        }

        // 如果還不夠四個，隨機生成
        while (options.size < 4) {
            const random = Math.floor(Math.random() * 81) + 1;
            if (!options.has(random)) {
                options.add(random);
            }
        }

        // 轉為陣列並隨機排列
        const optionsArray = Array.from(options);
        this.shuffle(optionsArray);

        return optionsArray;
    },

    /**
     * Fisher-Yates 洗牌演算法
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * 生成完整題目（含選項）
     * @returns {Object} { num1, num2, answer, questionKey, options, correctIndex }
     */
    createQuestion() {
        const question = this.generate();
        const options = this.generateOptions(question.answer, question.num1, question.num2);
        const correctIndex = options.indexOf(question.answer);

        return {
            ...question,
            options,
            correctIndex
        };
    },

    /**
     * 生成一局的題目（3 題）
     * @returns {Array} 題目陣列
     */
    createInning() {
        return [
            this.createQuestion(),
            this.createQuestion(),
            this.createQuestion()
        ];
    },

    /**
     * 記錄答題結果
     */
    recordAnswer(questionKey, isCorrect) {
        if (isCorrect) {
            Storage.recordCorrectAnswer(questionKey);
        } else {
            Storage.recordWrongAnswer(questionKey);
        }
    }
};
