import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Users, BarChart3, Shield, Star, ArrowRight, 
  CheckCircle, Activity, Clock, CreditCard 
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/layout/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const features = [
  { icon: Calendar, title: "スマート予約管理", desc: "オンライン予約・カレンダー管理・自動リマインダーで予約業務を効率化。" },
  { icon: Users, title: "患者カルテ管理", desc: "患者プロフィール・来院履歴・問診票・施術メモを一元管理。" },
  { icon: BarChart3, title: "売上分析", desc: "請求書・月次売上・予測・保険請求をひと目で確認。" },
  { icon: Shield, title: "保険対応", desc: "国民健康保険・社会保険の管理と負傷原因メモ・請求管理に対応。" },
  { icon: Activity, title: "施術記録", desc: "詳細な施術記録・部位メモ・セッションコースパッケージ管理。" },
  { icon: Star, title: "患者レビュー", desc: "満足度アンケート・評価ダッシュボード・スタッフ別評価指標。" },
];

const testimonials = [
  { name: "田中先生", clinic: "田中整骨院", rating: 5, text: "CareDeskで院全体の業務が効率化されました。初月で予約数が40%増加しました。" },
  { name: "佐藤先生", clinic: "佐藤整体クリニック", rating: 5, text: "保険管理機能だけで毎週何時間も節約できています。どの院にも強くお勧めします。" },
  { name: "山本先生", clinic: "山本整体院", rating: 5, text: "患者様がオンライン予約を大変喜んでいます。自動リマインダーで無断キャンセルが60%減少しました。" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ヘッダー */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">CareDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">ログイン</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1">
                無料トライアル開始 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-center"
        >
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            🎉 30日間無料トライアル — クレジットカード不要
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            日本の<span className="text-primary">整骨院・整体院・鍼灸院</span>向け<br />
            オールインワン管理システム
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            予約管理・患者カルテ・請求・スタッフ管理をひとつのプラットフォームで。
            日本の保険制度に完全対応。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 gap-2">
                院を登録する <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                詳しく見る
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* 機能紹介 */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              院の運営に必要なすべてが揃う
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              予約から請求まで、院全体の業務を一元管理。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">シンプルな料金体系</h2>
            <p className="text-muted-foreground text-lg">まず無料で試して、準備ができたらアップグレード。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="border-2 border-border">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-1">無料トライアル</h3>
                <p className="text-muted-foreground text-sm mb-6">30日間すべての機能を無料でお試し</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">¥0</span>
                  <span className="text-muted-foreground ml-1">/30日間</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["全機能利用可能", "患者数無制限", "オンライン予約ページ", "スタッフ管理", "クレジットカード不要"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant="outline" className="w-full">無料で始める</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                おすすめ
              </div>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-1">プロフェッショナル</h3>
                <p className="text-muted-foreground text-sm mb-6">成長中の院に最適</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">¥3,000</span>
                  <span className="text-muted-foreground ml-1">/月</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["無料トライアルの全機能", "優先サポート", "高度な分析機能", "カスタム予約ページ", "保険請求ツール"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button className="w-full">今すぐ始める</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* お客様の声 */}
      <section className="py-20 px-4 sm:px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">全国の院から愛されています</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground mb-4 leading-relaxed">「{t.text}」</p>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.clinic}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">院のデジタル化を今すぐ始めませんか？</h2>
          <p className="text-muted-foreground text-lg mb-8">
            すでに数百の院がCareDeskで業務を効率化しています。
          </p>
          <Link to="/register">
            <Button size="lg" className="text-base px-10 gap-2">
              30日間無料トライアルを始める <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
