import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CareDesk</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">特定商取引法に基づく表示</h1>
        <p className="text-sm text-muted-foreground mb-10">最終更新日：2026年5月17日</p>

        <div className="space-y-0">
          {[
            ["販売業者", "CareDesk運営者"],
            ["所在地", "福岡県（詳細は請求があれば遅滞なく開示します）"],
            ["連絡先", "fanshengshangmai24@gmail.com"],
            ["サービス名", "CareDesk（整骨院・接骨院・整体院・鍼灸院向け管理システム）"],
            ["販売価格", "月額 3,000円（税込）"],
            ["支払方法", "クレジットカード（Stripe決済）"],
            ["支払時期", "毎月自動更新（登録日を基準に1ヶ月ごとに自動課金）"],
            ["役務の提供時期", "登録完了後、即時利用可能"],
            ["返金・解約について", "月途中での解約・返金には対応しておりません。翌月末日までに解約申請をいただいた場合、翌月以降の課金を停止します。"],
            ["動作環境", "モダンブラウザ（Google Chrome・Safari・Mozilla Firefox・Microsoft Edge）の最新版"],
            ["お問い合わせ", "fanshengshangmai24@gmail.com"],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 border-b py-4 gap-4 text-sm">
              <dt className="font-medium text-muted-foreground col-span-1">{label}</dt>
              <dd className="col-span-2">
                {label === "連絡先" || label === "お問い合わせ" ? (
                  <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </div>

        <div className="mt-10 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            ※ 無料トライアル期間（30日間）中は課金されません。トライアル終了後に有料プランへ移行される場合のみ、上記料金が発生します。
          </p>
        </div>
      </main>

      <footer className="border-t py-6 px-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">プライバシーポリシー</Link>
            <Link to="/legal" className="hover:text-foreground">特定商取引法に基づく表示</Link>
            <Link to="/terms" className="hover:text-foreground">利用規約</Link>
          </div>
          <p>© 2026 CareDesk</p>
        </div>
      </footer>
    </div>
  );
}
