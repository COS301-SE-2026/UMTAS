import { FaqCategory } from "../../../types/faq";
const CHeading = ({ text }: { text: string }) => <h3>{text}</h3>;
import { FaqItemBlock } from "@/components/molecules/faq/faqMolecule";

const FaqCategorySection = ({ category }: { category: FaqCategory }) => (
  <section key={category.id} className="faq-category">
    <CHeading text={category.name} />
    <div className="faq-list">
      {category.items.map((item) => (
        <FaqItemBlock key={item.id} item={item} />
      ))}
    </div>
  </section>
);

export { FaqCategorySection };
