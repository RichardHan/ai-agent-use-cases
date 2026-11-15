# 獨立調查回收與主 agent 核對

## CurrentActionsAudit

已回收。agent以目前GitHub API查main與run/steps，因沒有shell／寫入工具，logs API未認證403；錯誤內文引用主agent重新下載的原始ZIP，沒有冒充自行下載。它確認基準f764…只有Pages；c2b…的Website QA發布gate與正式瀏覽器有實跑。最近三次failure步驟／SHA與主保存的failure-steps.jsonl一致，後續綠燈，不重跑舊run。

concurrency：PR可取消、main保留裁決；歷史曾因60分鐘等待阻塞下一run，目前未觀測擁塞。兩支main publication caller已有actions:read及token；未發現同workflow同SHA重複觸發、cache／權限事故。artifact不可得會沿用原60分鐘窗而非立即fatal，屬明示延遲風險，本輪不新增另一套重試政策。

主agent不採其「docs-only該版從未被deployed-browser走查」的推論：只能說沒有該版Website QA run，不能排除本機／其他程序；本輪baseline-browser.txt已證明f764…被主實走。agent文字把預期skipped的Fail-when步驟與success並述，主僅認定真正的wait與browser步驟success，並不把skipped當success。

## VisitorFlowAudit

已回收。agent無瀏覽器／寫入工具，只做repo與正式原始HTML調查，不算獨立實走。主要JS訪客流程未提出可證新缺陷；主已有正式基準與最終預覽兩尺寸三情境證據。

候選A：Jekyll備援案例頁呈現author-demo／designed機器碼，原文URL為純文字。主重新讀正式 `cases/001-travel-checkout.html` 的原始HTML，確認 `<p>原文：https://www.aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots</p>` 無anchor，頁首有兩種機器碼。這個具體頁面有證據，但未逐頁驗證全部522頁，不能把抽樣外推成每頁皆有同缺陷。

候選B：缺少自訂404，錯路徑回HTTP404。agent讀不到404 body，GitHub預設畫面及缺導覽為推測；主不將其當已驗畫面。它用UC編號跳號推測案例刪除也不成立：例如UC-008／009／013在evidence而非cases，不能僅靠編號斷定舊網址原本存在。也不採其「絕對不能改任何Markdown URL」說法：本輪保留原文，但合法未來內容變更可隨commit由版本閘門驗證。

取捨：不擴大本輪；下一輪優先實際關閉JS，從INDEX到UC-001，驗原文可點性與證據圖例，再比較設定GFM自動連結與最小備援layout兩案。全HTML artifact範圍擴大仍是已知有限覆蓋，不與下一輪訪客主題混成大重寫。
