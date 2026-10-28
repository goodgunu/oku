import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, OPERATOR_NAME } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー">
      <section className="space-y-2">
        <h2 className="font-bold">1. 取得する情報</h2>
        <p className="text-muted">
          {OPERATOR_NAME}では、ログインやアカウント連携のためにメールアドレスまたは各サービスの識別子（LINE・X・Google等）、および利用者自身が保存した出品ページのURL・タイトル・価格・写真・メモを保存します。
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">2. 利用目的</h2>
        <p className="text-muted">
          保存した出品一覧の表示、価格変動・終了の確認、LINEでのお知らせ通知、およびサービス改善のためにのみ利用し、第三者へ販売・提供することはありません。
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">3. お問い合わせ</h2>
        <p className="text-muted">
          本ポリシーに関するお問い合わせは、{CONTACT_EMAIL} までご連絡ください。
        </p>
      </section>
    </LegalPage>
  );
}
