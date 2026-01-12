# 全壘打乘法王 - 專案架構

## 技術棧
- **前端**: Vanilla JavaScript + HTML5 + CSS3
- **動畫**: Canvas 2D API
- **音效**: Web Audio API
- **存儲**: localStorage
- **部署**: GitHub Pages (靜態網站)

## 檔案結構
```
/
├── index.html          # 主頁面
├── css/style.css       # 樣式（響應式 + iPad 優化）
├── js/
│   ├── storage.js      # localStorage 存檔系統
│   ├── questions.js    # 題庫生成 + 錯題機制
│   ├── animation.js    # Canvas 棒球場動畫
│   └── game.js         # 遊戲主邏輯
├── assets/
│   ├── sprites/        # 圖片素材（未使用）
│   └── sounds/         # 音效檔案（未使用，改用 Web Audio）
└── docs/
    └── GDD.md          # 遊戲設計企劃書
```

## 核心設計決策

### 無懲罰機制
- 答錯 = 界外球（可重試）
- 無時間限制（慢答仍得保送）

### 速度獎勵
| 時間 | 結果 | 星星 |
|-----|------|-----|
| < 2 秒 | 全壘打 | ⭐⭐⭐ |
| 2-4 秒 | 三壘安打 | ⭐⭐⭐ |
| 4-6 秒 | 二壘安打 | ⭐⭐ |
| 6-10 秒 | 一壘安打 | ⭐ |
| > 10 秒 | 保送 | ⭐ |

### 題庫設計
- Easy (1/3): ×1, ×2, ×5, ×10
- Normal (2/3): ×3, ×4, ×6, ×7, ×8, ×9
- 錯題權重 +3 倍，連對 3 次移出錯題庫

## 當前狀態
- [x] GDD 文檔
- [x] 基礎架構
- [x] 題庫系統
- [x] 計時獎勵
- [x] Canvas 動畫
- [x] 存檔系統
- [x] 音效
- [ ] GitHub Pages 部署
