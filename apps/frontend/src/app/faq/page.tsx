import { FaqCategorySection } from "@/components/organisms/faq/faqOrganisms";
// import { helpCentreData } from '../../types/faq';
// import { FaqCategorySection } from '@/components/organisms/faq/faqOrganisms';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  items: FaqItem[];
}

export interface helpCentreData {
  categories: FaqCategory[];
}

//not too sure where i should put this but here it is :
const johanHierisDieData: helpCentreData = {
  categories: [
    {
      id: "faq_cat_1",
      name: "General & Account Management",
      items: [
        {
          id: "faq_id-1-1",
          question: "What is UMTAS?",
          answer:
            "UMTAS is a timetable allocation and building system designed to help you organise your university modules and courses efficiently.",
        },
        {
          id: "faq_id-1-2",
          question: "How do I sign in or register for an account?",
          answer:
            "You can register a new account using your email and password, or you can sign in quickly using Google OAuth authentication.",
        },
      ],
    },
    {
      id: "faq_cat_2",
      name: "PDF Parsing & Timetable Imports",
      items: [
        {
          id: "faq_id-2-1",
          question: "What types of files can I upload to the PDF parser?",
          answer:
            "The system supports parsing for University of Pretoria (UP) timetable PDFs, specifically covering lectures, exams, and semester tests.",
        },
        {
          id: "faq_id-2-2",
          question: "Why is my uploaded PDF failing to process?",
          answer:
            "Processing may fail if the document is a malformed UP timetable format, such as PDFs with missing header columns, invalid start times, or mismatched rows.",
        },
      ],
    },
    {
      id: "faq_cat_3",
      name: "Timetable Builder & Solver",
      items: [
        {
          id: "faq_id-3-1",
          question: "How does the timetable solver generate my schedule?",
          answer:
            "The solver utilises Constraint Programming (CP) and Genetic Algorithms (GA) to automatically resolve conflicts and generate a schedule based on your inputs.",
        },
        {
          id: "faq_id-3-2",
          question: "Can I customise the generated timetable?",
          answer:
            "Yes, within the timetable builder, you can add custom events, configure time slot selections, and set specific preferences for your modules before finalising the schedule.",
        },
      ],
    },
    {
      id: "faq_cat_4",
      name: "Course & Module Management",
      items: [
        {
          id: "faq_id-4-1",
          question: "How do I add modules to my course?",
          answer:
            "You can navigate to the Course Management dashboard to search for, add, and edit specific modules associated with your academic profile.",
        },
        {
          id: "faq_id-4-2",
          question: "Can I manage events for different universities?",
          answer:
            "Yes, you can use the 'Choose Institute' feature to select your specific university and align your schedule with its unique academic calendar and venues.",
        },
      ],
    },
    {
      id: "faq_cat_5",
      name: "Roles & Permissions",
      items: [
        {
          id: "faq_id-5-1",
          question: "How do I request a different user role?",
          answer:
            "You can apply for specialised roles through the Role Management interface, which allows administrators to review and approve institute-specific permissions.",
        },
        {
          id: "faq_id-5-2",
          question: "Where can I check the status of my role application?",
          answer:
            "You can view your current approval status in the 'Pending Applications' section of the Role Management dashboard.",
        },
      ],
    },
  ],
};

const HelpCentrePage = () => (
  <main className="help-centre">
    <h2>Help Centre</h2>
    {johanHierisDieData.categories.map((category) => (
      <FaqCategorySection key={category.id} category={category} />
    ))}
  </main>
);

export default HelpCentrePage;
