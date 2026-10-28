import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, OPERATOR_NAME } from "@/lib/legal";

export default function TermsPage() {
  return (
    <LegalPage title="利用規約">
      <section className="space-y-2">
        <h2 className="font-bold">1. サービスの内容</h2>
        <p className="text-muted">
          {OPERATOR_NAME}は、オークション・フリマ等の出品ページを個人的な控え・比較メモとして保存するサービスです。各出品の文章や写真の権利は元の出品者および運営サイトに帰属します。
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">2. 禁止事項</h2>
        <p className="text-muted">
          過度な連続アクセス、不正なスクレイピング、第三者の権利を侵害する形での再配布・商用利用を禁止します。
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">3. 免責事項・お問い合わせ</h2>
        <p className="text-muted">
          元のサイトの仕様変更等により一部情報が取得できない場合があります。お問い合わせは {CONTACT_EMAIL} までご連絡ください。
        </p>
      </section>
    </LegalPage>
  );
}
