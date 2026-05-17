import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-muted-foreground mb-10">施行日：2026年5月17日</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. 個人情報の収集目的</h2>
            <p>
              CareDesk（以下「当サービス」）は、整骨院・接骨院・整体院・鍼灸院の運営者（以下「利用者」）および
              その患者様の個人情報を、以下の目的のために収集・利用します。
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>予約管理・来院予約の受付および確認</li>
              <li>患者カルテ・施術記録の管理</li>
              <li>請求・会計処理および保険請求補助</li>
              <li>当サービスの提供・維持・改善</li>
              <li>利用料金の決済処理</li>
              <li>サービスに関するお知らせ・サポート対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. 収集する個人情報の種類</h2>
            <p>当サービスでは、以下の個人情報を収集することがあります。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>氏名・フリガナ</li>
              <li>電話番号</li>
              <li>メールアドレス</li>
              <li>生年月日</li>
              <li>住所</li>
              <li>施術記録・問診票の内容</li>
              <li>予約・来院履歴</li>
              <li>支払い情報（カード情報はStripeが管理し、当サービスは保持しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. 個人情報の第三者提供</h2>
            <p>
              当サービスは、以下の場合を除き、収集した個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>本人の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>決済処理のためStripe, Inc.に必要な情報を提供する場合（Stripeのプライバシーポリシーが適用されます）</li>
            </ul>
            <p className="mt-2">
              Stripe以外の外部サービスへの個人情報の販売・提供は行いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. 個人情報の管理・保管</h2>
            <p>
              収集した個人情報は、Oracle Cloud 大阪リージョン（日本国内）のサーバーにて厳重に管理します。
              不正アクセス・紛失・破壊・改ざん・漏洩を防ぐため、適切なセキュリティ対策を講じています。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. 個人情報の開示・訂正・削除の請求</h2>
            <p>
              ご本人から個人情報の開示・訂正・削除・利用停止の請求があった場合、本人確認のうえ、
              合理的な期間内に対応いたします。
              請求は下記のお問い合わせ先までメールにてご連絡ください。
            </p>
            <p className="mt-2">
              <span className="font-medium">お問い合わせ先：</span>{" "}
              <a href="mailto:fanshengshangmai24@gmail.com" className="text-primary hover:underline">
                fanshengshangmai24@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. 個人情報管理責任者</h2>
            <p>
              CareDesk運営者<br />
              所在地：福岡県<br />
              連絡先：
              <a href="mailto:fanshengshangmai24@gmail.com" className="text-primary hover:underline">
                fanshengshangmai24@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Cookieの使用について</h2>
            <p>
              当サービスでは、ログイン状態を維持するための認証トークン（JWT）のみをブラウザに保存します。
              広告目的のCookieや、行動追跡目的のサードパーティCookieは使用しません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. プライバシーポリシーの改定</h2>
            <p>
              当サービスは、法令の変更やサービス内容の変更に応じて、プライバシーポリシーを改定することがあります。
              改定した場合は、本ページに掲載するとともに、施行日を更新します。
              重要な変更がある場合は、メール等にてご通知します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. お問い合わせ</h2>
            <p>
              プライバシーポリシーに関するご質問・ご意見は、下記までお問い合わせください。
            </p>
            <p className="mt-2">
              <a href="mailto:fanshengshangmai24@gmail.com" className="text-primary hover:underline">
                fanshengshangmai24@gmail.com
              </a>
            </p>
          </section>

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
