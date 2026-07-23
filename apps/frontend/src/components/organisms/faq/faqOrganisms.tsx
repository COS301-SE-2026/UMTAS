import { FaqCategory } from "../../../types/faq";
const CHeading = ({ text }: { text: string }) => <h3>{text}</h3>;
// import { FaqItemBlock } from "@/components/molecules/faq/faqMolecule";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/baseShadcn/accordion";
import { Separator } from "@/components/atoms/baseShadcn/separator";
export const FaqCategorySection = ({ category }: { category: FaqCategory }) => {
  return (
    <section className="mb-12">
      <h2 className="text-[24px] font-semibold leading-[1.3] text-primary mb-4 tracking-normal">
        {category.name}
      </h2>
      <Separator className="mb-4 bg-border" />

      <Accordion type="multiple" className="w-full">
        {category.items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border-b border-border"
          >
            <AccordionTrigger className="text-left text-[15px] font-medium leading-[1.4] hover:text-primary transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-[14px] font-normal leading-[1.6] text-primary pt-2 pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
