# LUXS 開発バックログ (Backlog)

本ドキュメントは、LUXSの商用化およびマネタイズ基盤構築に向けた実装タスクを管理するバックログです。

---

## 1. フリーミアム境界線（Paywall）と機能制限の実装

- [ ] **エクスポート時ウォーターマーク（透かし）機能**
  - 無料プランのエクスポート画像右下に控えめな「LUXS」ロゴウォーターマークをCanvas合成する処理を追加
  - PROプラン判定時はウォーターマーク合成をスキップ
- [ ] **解像度・品質制限**
  - 無料プラン：長辺最大1920px（フルHD解像度）に制限
  - PROプラン：元動画解像度（4K等）の原寸ロスレス出力を許可
- [ ] **PRO専用機能のロックUIとバッジ表示**
  - 全コマ一括ZIP保存ボタンにPROバッジを付与し、未課金時はProModalをトリガー
  - 上位トーンプリセット（例: モノクロ、高コントラストフィルム等）のロック表示
  - ループ動画・組写真の高解像度書き出し制限
- [ ] **UI内のPROプラン誘導動線の整備**
  - ヘッダー右上（テーマ切替の横）に「PROへアップグレード」ボタンを配置
  - エクスポート完了時トーストまたはプレビュー画面内にPRO特典案内を配置

---

## 2. 認証基盤およびユーザー管理

- [ ] **認証プロバイダの選定と導入**
  - Clerk または Supabase Auth のNext.js App Router向けSDKを導入
  - サインアップ / ログイン / ログアウト画面の実装
- [ ] **データベース設計**
  - ユーザーテーブル（id, email, created_at）
  - サブスクリプション管理テーブル（user_id, stripe_customer_id, status, plan_type, current_period_end）
- [ ] **セッション管理とAPI認証ガード**
  - Next.js MiddlewareおよびServer Actionsでの認証トークン検証
  - クライアント側でのユーザープラン状態（isPro）フック提供

---

## 3. 決済基盤（Stripe）の統合

- [ ] **Stripe商品・価格設定**
  - Stripeダッシュボードでのプロダクト登録（年額、月額、単発パス）
- [ ] **Stripe Checkout連携**
  - ProModal内の購入ボタンからStripe Hosted CheckoutへのリダイレクトAPI実装
- [ ] **Stripe Webhook処理**
  - `/api/stripe/webhook` エンドポイントの実装
  - `checkout.session.completed`（決済完了時のPRO権限付与）
  - `customer.subscription.updated` / `deleted`（プラン変更・解約時のステータス更新）
  - Webhook署名検証の実装
- [ ] **Stripe Customer Portal（解約・請求先変更）**
  - ユーザーが自身の支払い情報や解約を管理できるポータル画面への遷移リンク実装

---

## 4. モバイル・マルチプラットフォーム最適化

- [ ] **PWA（Progressive Web App）対応**
  - `manifest.json` およびアプリアイコン、オフラインキャッシュ設定
  - ホーム画面追加プロンプトの設計
- [ ] **モバイルブラウザでのメモリ保護**
  - 長尺動画展開時のCanvasメモリ消費量削減（ダウンサンプリング、Blob解放処理の徹底）
- [ ] **ネイティブアプリ化（中長期検討）**
  - Capacitor または React Native によるiOS/Androidネイティブ化
  - Apple In-App Purchase（StoreKit）によるワンタップ課金導入

---

## 5. プリント・物販（Physical Goods）連携

- [ ] **オンデマンド印刷（POD）連携選定**
  - 印刷所（富士フイルム、Canvashy、Printful等）のAPI調査と受発注仕様策定
- [ ] **注文・配送先情報入力フローの実装**
  - PrintOrderModal内に配送先住所・受取人氏名・連絡先入力フォームを追加
  - 配送料計算および合計金額表示の実装
- [ ] **印刷用超解像・CMYKカラー処理**
  - 印刷基準（300dpi〜350dpi）を満たすためのアップスケールレンダリング処理
  - 印刷用PDF / 高解像度TIFF・PNG生成
- [ ] **特定商取引法に基づく表記・規約ページの作成**
  - 返品・キャンセルポリシー、事業者情報、配送料金の明記
