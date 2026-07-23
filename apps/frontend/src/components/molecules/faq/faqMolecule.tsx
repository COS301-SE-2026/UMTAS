import { FaqItem } from "@/types/faq";

const QText = ({ text }: { text: string }) => <strong>{text}</strong>;
const AText = ({ text }: { text: string }) => <p>{text}</p>;

const FaqItemBlock = ({ item }: { item: FaqItem }) => (
  <div key={item.id} className="faq-item">
    <QText text={item.question} />
    <AText text={item.answer} />
  </div>
);

export { FaqItemBlock };
