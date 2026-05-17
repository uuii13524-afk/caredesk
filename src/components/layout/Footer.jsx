import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            プライバシーポリシー
          </Link>
          <Link to="/legal" className="hover:text-foreground transition-colors">
            特定商取引法に基づく表示
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            利用規約
          </Link>
        </div>
        <p>© 2026 CareDesk</p>
      </div>
    </footer>
  );
}
