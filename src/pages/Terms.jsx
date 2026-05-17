import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-3xl font-bold mb-2">利用規約</h1>
        <p className="text-sm text-muted-foreground mb-10">施行日：2026年5月17日</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold mb-3">第1条（サービスの概要）</h2>
            <p>
              CareDesk（以下「当サービス」）は、整骨院・接骨院・整体院・鍼灸院の運営者向けに、
              予約管理・患者カルテ管理・請求管理・スタッフ管理等の業務支援機能を提供するクラウド型管理システムです。
              本利用規約（以下「本規約」）は、当サービスを利用するすべてのユーザーに適用されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第2条（利用資格）</h2>
            <p>
              当サービスは、整骨院・接骨院・整体院・鍼灸院を運営する個人または法人を対象としています。
              未成年者が当サービスを利用する場合は、法定代理人の同意が必要です。
              当サービスへの登録をもって、本規約のすべての条項に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第3条（アカウント管理）</h2>
            <p>
              利用者は、アカウントのIDおよびパスワードを自己の責任において管理するものとします。
              第三者へのアカウント情報の開示・譲渡・貸与は禁止します。
              アカウントの不正使用により生じた損害について、当サービス運営者は責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第4条（禁止事項）</h2>
            <p>利用者は、以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>当サービスへの不正アクセスまたはその試み</li>
              <li>虚偽の情報を登録する行為</li>
              <li>当サービスのアカウントまたは機能を第三者に転売・譲渡する行為</li>
              <li>当サービスのシステムに過度な負荷をかける行為</li>
              <li>他の利用者または第三者の権利を侵害する行為</li>
              <li>法令または公序良俗に違反する行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>その他、当サービス運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第5条（免責事項）</h2>
            <p>
              当サービス運営者は、以下の事項について一切の責任を負いません。
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>システム障害・メンテナンス・第三者の行為等によるサービスの停止・中断</li>
              <li>天災・通信障害・その他不可抗力によるデータの損失</li>
              <li>利用者が当サービスを通じて得た情報の正確性・完全性</li>
              <li>利用者間またはユーザーと患者間のトラブル</li>
            </ul>
            <p className="mt-2">
              当サービスの利用によって生じた損害に対する運営者の賠償責任は、
              当該損害が発生した月に利用者が支払った利用料金を上限とします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第6条（個人情報の取り扱い）</h2>
            <p>
              当サービスにおける個人情報の取り扱いについては、別途定める
              <Link to="/privacy" className="text-primary hover:underline mx-1">プライバシーポリシー</Link>
              に従います。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第7条（サービスの変更・停止）</h2>
            <p>
              当サービス運営者は、事前の通知をもって、サービスの内容を変更または停止することがあります。
              重大な変更を行う場合は、登録メールアドレスへの通知またはサービス内の告知により、
              原則として30日前までにお知らせします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">第8条（準拠法および管轄裁判所）</h2>
            <p>
              本規約は日本法に準拠するものとします。
              当サービスに関して生じた紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">お問い合わせ</h2>
            <p>
              本規約に関するご質問は、下記までお問い合わせください。
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
