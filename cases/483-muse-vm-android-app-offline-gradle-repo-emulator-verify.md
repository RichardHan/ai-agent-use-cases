# UC-483：在 Muse 雲端 VM 做 Android App：JVM 連不上網就用 curl 種出本機 Maven 倉庫跑離線 Gradle，再用模擬器走完全流程

- 情境：開發
- 標籤：雲端電腦、行動App、故障診斷、驗收
- 網站標題：代理的雲端電腦裝不了 Android 套件？改用 curl 把依賴抓成本機倉庫、Gradle 離線建置，再在模擬器把每條路徑跑一遍
- 一句話用途：日文作者 satouyoshiaki 自述與 Meta Muse 一起做 Android App「長按助理鍵錄螢幕→停止後把影片或抽出的畫格分享給 AI App 解說」。先和 Muse 盤點平台限制（VoiceInteractionService、MediaProjection 每次同意框不可省、AI App 無直接寫入 API 只能用分享選單、iOS 不可行），再在 Muse 的 VM 建置：VM 內 JVM 對外 TCP 被擋，Gradle 解析失敗，改以 curl 下載 .pom／.module 及其 variants 種成 Maven 格式本機倉庫，`--offline` 建置→從失敗記錄抓缺少模組→再種，各約10輪收斂（約350模組、320MB）；之後在 API 28 模擬器驗證全流程並修掉 setTheme 呼叫位置錯誤。實機尚未測。
- 核心目標：在網路受限的代理雲端電腦上完成可重現的 App 建置與模擬器驗收，並誠實區分「模擬器通過」與「實機可用」。
- 分類／標籤：代理協作開發／受限環境建置
- 目標使用者：想讓代理在雲端 VM 幫忙做 Android App、卻遇到網路或套件下載限制的開發者
- 工具：Meta Muse（雲端 VM）／Kotlin、Gradle（AGP 8.5.2）、Android SDK、adb、Android 9 模擬器／curl、ffprobe
- 首次收錄／最近查證：2026-11-01 08:51（台灣時間）
- 證據狀態：author-demo（作者 Qiita 自述＋錯誤訊息原文與模擬器截圖；原始碼不公開）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：App 需求；Muse 的 VM（無法從 JVM 對外連線）；可用 curl 下載的公開 Maven 倉庫。
- 輸出：可行性清單與改良案（畫格抽出模式、自動附解說提示詞、錄音註解、快速設定磚）；app-debug.apk（約5.2MB）；模擬器逐路徑驗收紀錄；實機測試清單。

## 來源版本

### 來源A：satouyoshiaki（Qiita，日文）

- 原文：[画面録画を AI に解説してもらう Android アプリを Muse と作った](https://qiita.com/satouyoshiaki/items/c5f99a0cef958c8bbef3)，2026-10-31 23:01 JST（台灣時間 22:01）；以 Qiita 公開 API 讀全文。
- 取得內容（翻譯摘要）：
  1. 可行性盤點：預設助理替換可做長按啟動但會取代原助理；錄影每次需同意；送往 AI 用分享選單（ACTION_SEND），各 App 是否接受影片需實機確認；iOS 不可行。
  2. Gradle daemon 連不上 → 刪除 `org.gradle.jvmargs`、設 `org.gradle.daemon=false`、以 `GRADLE_OPTS` 給記憶體改為行程內執行。
  3. 外掛解析失敗（plugin not found）→ 判斷 JVM TCP 對外不通 → curl 種本機 Maven 倉庫＋`--offline`，自動迴圈補缺；SDK 位置要寫在 `local.properties` 的 `sdk.dir`，aapt2 需依 OS classifier 特別處理。
  4. `adb install` 近10分鐘不返回：裝置端 dex2oat 仍在跑；改用 `pm list packages` 判定完成。
  5. 同意對話框 `input tap` 無效 → 改 Tab 移動焦點＋Enter。
  6. 實際錯誤 `IllegalStateException: Must be called before onCreate()` → setTheme 移到 onCreate；並加上錄影中重複啟動的防護。
  7. 模擬器驗收：設定保存、錄影 mp4（ffprobe 確認 H.264 480x800、266.5秒）、分享選單、12張畫格抽出、長按啟動全路徑。
- 作者報告結果：建置與模擬器驗收完成；實機（Xiaomi 17T Pro／HyperOS）尚未測，結果待續篇。
- 失敗點／缺口：原始碼私有；種倉庫腳本未公開；Muse 在各步驟扮演的角色比例未細分。

## 建議操作流程（本庫依來源整理，未實測）

1. 開工前請代理列出平台限制與「做不到的部分」，先決定替代方案。
2. 建置失敗時先區分是工具設定、網路還是程式；網路受限時用可對外的工具（如 curl）準備離線依賴，記錄每輪補了哪些模組。
3. 模擬器驗收逐條路徑留證據（檔案資訊、截圖、logcat），把「未在實機驗證」的項目列成清單，不宣稱完成。

## 可複製提示詞（本庫原創，未實跑）

> 在動手寫程式前，先列出這個 App 在 Android 上每個功能的可行性、官方 API、不能省略的使用者確認，以及做不到的部分。建置時若 Gradle 解析依賴失敗，先測 JVM 與 curl 是否都能對外連線並回報結果；若只有 curl 可用，改成下載依賴到本機 Maven 倉庫並以離線模式建置，每輪記錄新增模組數，超過［N］輪仍未收斂就停下問我。驗收請在模擬器逐條路徑附證據，最後另列「實機才能確認」的項目。

## 所需連接、權限與限制

- 從公開倉庫下載依賴需注意來源與完整性；本機倉庫約數百 MB。
- 預設助理替換與螢幕錄影涉及隱私權限，實機使用前需本人確認。
- 這是 Muse VM 環境的作者經驗；VM 網路政策可能變動，不推定其他代理（Grok Bot、dots）有相同限制或解法。

## 驗收與可重現性

- 可驗收：離線建置成功產生 APK；模擬器各路徑有證據；實機清單逐項打勾後才稱可用。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-01 08:51 新增。UC-477（同作者）是 Muse VM 反向通道 SSH；本案是 VM 內 JVM 網路受限下的 Android 建置與模擬器驗收，另立案。
