# 隕石數學防衛隊 Meteor Math Defense

## 專案概要

- **類型**：9x9 乘法練習遊戲（太空隕石主題）
- **平台**：iPad Safari 觸控優化
- **部署**：GitHub Pages 靜態網站
- **技術**：單檔 HTML + CSS + Vanilla JS（無框架依賴）

---

## 遊戲機制

### 三關卡制

| 關卡 | 題數 | 間隔 | 落速 (px/frame) | 倍率 |
|------|------|------|-----------------|------|
| 1    | 10   | 4s   | 0.6 ~ 0.9       | x1.0 |
| 2    | 15   | 3s   | 0.9 ~ 1.2       | x1.5 |
| 3    | 20   | 2s   | 1.2 ~ 1.5       | x2.0 |

### 題庫分類（同 99times）

- **Easy**：n×2 所有組合 + 3×3（16 題）
- **Hard**：其餘 3~9 互乘組合（48 題）

### 智慧出題配額表

| 錯題數 | 回合 | 錯題 | easy | hard | 總計 |
|--------|------|------|------|------|------|
| 0      | 1    | 0    | 2    | 8    | 10   |
| 0      | 2    | 0    | 3    | 12   | 15   |
| 0      | 3    | 0    | 4    | 16   | 20   |
| 1      | 1    | 1    | 2    | 7    | 10   |
| ≥2     | 1    | 2    | 1    | 7    | 10   |

### 得分區域

| 區域 | Y 範圍 | 基礎分 |
|------|--------|--------|
| 天空 | 0-30%  | 100    |
| 高空 | 30-60% | 80     |
| 低空 | 60-85% | 60     |
| 地面 | 85%+   | 40     |

**最終得分 = 基礎分 × 關卡倍率**

---

## 核心類別

### StatsManager
- `getStats()` → 取得各題答對次數
- `getErrors()` → 取得錯題庫
- `addError(key)` → 加入錯題庫（streak=0）
- `incrementCorrect(key)` → 答對次數 +1
- `incrementStreak(key)` → 連續答對 +1，≥3 移出錯題庫
- `selectFromPool(pool, count, excludeKeys)` → 智慧選題

### RecordsManager
- `getRecords()` → 取得前 10 名記錄
- `saveRecord(score)` → 儲存並回傳排名
- `getHighScore()` → 取得最高分

### Game
- `prepareStageQuestions()` → 依配額表生成回合題目
- `generateQuestion()` → 從預生成列表取題
- `handleGrounded(meteor)` → 落地加入錯題庫
- `handleMiss()` → 單隕石答錯偵測
- `destroyMeteor(meteor)` → 更新答對統計
- `showStats(tab, multiplier)` → 統計頁面

---

## 錯題追蹤機制

### 觸發條件
1. **隕石落地**：該題加入錯題庫
2. **單隕石答錯**：畫面只有 1 顆時答錯，加入錯題庫

### 移除條件
- 連續答對 3 次（streak ≥ 3）

### 資料結構
```javascript
// localStorage 持久化
questionStats: { "2×3": 5, "7×8": 1, ... }
errorBank: [{ key: "7×8", streak: 0 }, ...]
```

---

## 技術決策

| 項目 | 選擇 | 理由 |
|------|------|------|
| 架構 | 單檔 HTML | 簡化部署、易於維護 |
| 動畫 | CSS + DOM | 簡單效果足夠、無需 Canvas |
| 存儲 | localStorage | 離線可用、無後端 |
| 迴圈 | requestAnimationFrame | 流暢 60fps |

---

## Git 分支策略

- `main`：穩定版本
- `feat/*`：新功能
- `fix/*`：Bug 修復
