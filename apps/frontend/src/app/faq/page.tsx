import { FaqCategorySection } from "@/components/organisms/faq/faqOrganisms";
// import { helpCentreData } from '../../types/faq';
// import { FaqCategorySection } from '@/components/organisms/faq/faqOrganisms';
import Tutorial from "@/components/organisms/nav/Tutorial";

const steps = [
  {
    target: "#faq-categories",
    content:
      "Browse the help categories and select a question to view its answer.",
  },
];
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
      id: "faq_getting_started",
      name: "Getting Started",
      items: [
        {
          id: "faq_getting_started_1",
          question: "What should I do after creating my account?",
          answer:
            "Choose your university and role first. Once approved, UMTAS will show the tools available for your account.",
        },
        {
          id: "faq_getting_started_2",
          question: "Why can I not access some features?",
          answer:
            "Some features depend on your university, role, enrolments, or approval status.",
        },
      ],
    },
    {
      id: "faq_institute",
      name: "Institute Selection",
      items: [
        {
          id: "faq_institute_1",
          question: "How do I choose my university?",
          answer:
            "Use Choose Institute to select your university before accessing university-specific features.",
        },
        {
          id: "faq_institute_2",
          question: "Can I change my selected university?",
          answer:
            "Yes. Return to Choose Institute and select another supported university.",
        },
      ],
    },
    {
      id: "faq_roles",
      name: "Role Applications",
      items: [
        {
          id: "faq_roles_1",
          question: "What roles are available?",
          answer:
            "UMTAS supports students, lecturers, university administrators, and system administrators.",
        },
        {
          id: "faq_roles_2",
          question: "Why is my role still pending?",
          answer:
            "Some roles require approval from an administrator before their features become available.",
        },
      ],
    },
    {
      id: "faq_calendar_management",
      name: "Calendar Management",
      items: [
        {
          id: "faq_calendar_management_1",
          question: "What is Calendar Management used for?",
          answer:
            "Calendar Management lets administrators configure academic dates, restrictions, and scheduling rules.",
        },
        {
          id: "faq_calendar_management_2",
          question: "Can public holidays be included?",
          answer:
            "Yes. Public holidays can be included when configuring the academic calendar.",
        },
      ],
    },
    {
      id: "faq_restrictions",
      name: "Scheduling Restrictions",
      items: [
        {
          id: "faq_restrictions_1",
          question: "What are timetable restrictions?",
          answer:
            "Restrictions define times or dates that should not be used when generating a timetable.",
        },
        {
          id: "faq_restrictions_2",
          question: "Can I add more than one restriction?",
          answer:
            "Yes. Multiple restrictions can be added before timetable generation.",
        },
      ],
    },
    {
      id: "faq_preferences",
      name: "Timetable Preferences",
      items: [
        {
          id: "faq_preferences_1",
          question: "What are timetable preferences?",
          answer:
            "Preferences help UMTAS understand which timetable options are better suited to you.",
        },
        {
          id: "faq_preferences_2",
          question: "Do preferences guarantee a specific timetable?",
          answer:
            "No. UMTAS considers your preferences while still avoiding conflicts and meeting scheduling requirements.",
        },
      ],
    },
    {
      id: "faq_export",
      name: "Calendar Export",
      items: [
        {
          id: "faq_export_1",
          question: "Can I export my timetable?",
          answer:
            "Yes. UMTAS supports timetable export so you can use your schedule outside the system.",
        },
        {
          id: "faq_export_2",
          question: "Can I add my timetable to Google Calendar?",
          answer:
            "Yes. Supported timetables can be exported to Google Calendar or downloaded as a calendar file.",
        },
      ],
    },
    {
      id: "faq_enrolment",
      name: "Module Enrolment",
      items: [
        {
          id: "faq_enrolment_1",
          question: "How do I enrol in a module?",
          answer:
            "Use the available module enrolment tools to select modules linked to your university.",
        },
        {
          id: "faq_enrolment_2",
          question: "Why is a module not available for enrolment?",
          answer:
            "The module may belong to another university or may not currently be available to your account.",
        },
      ],
    },
    {
      id: "faq_sessions",
      name: "Lecturer Sessions",
      items: [
        {
          id: "faq_sessions_1",
          question: "What is a lecturer session?",
          answer:
            "A session links attendance or Lecture Watch data to a specific class or lecture.",
        },
        {
          id: "faq_sessions_2",
          question: "Can I use an existing session again?",
          answer:
            "Yes. Supported session tools allow you to select an existing session and capture new data.",
        },
      ],
    },
    {
      id: "faq_troubleshooting",
      name: "Browser & Troubleshooting",
      items: [
        {
          id: "faq_troubleshooting_1",
          question: "Which browser should I use?",
          answer:
            "A current version of Chrome is recommended for features that use cameras, NFC, or WebGPU.",
        },
        {
          id: "faq_troubleshooting_2",
          question: "Why is a camera or browser feature not working?",
          answer:
            "Check browser permissions, device support, and whether the required feature is available in your browser.",
        },
      ],
    },
    {
      id: "faq_general",
      name: "General & Account",
      items: [
        {
          id: "faq_general_1",
          question: "What is UMTAS?",
          answer:
            "UMTAS helps students and university staff manage timetables, modules, attendance, venues, and academic scheduling.",
        },
        {
          id: "faq_general_2",
          question: "How do I change my university or role?",
          answer:
            "Use Choose Institute to select your university and apply for the role you need. Some roles require approval.",
        },
      ],
    },
    {
      id: "faq_timetable",
      name: "Timetables & Calendar",
      items: [
        {
          id: "faq_timetable_1",
          question: "How do I create a timetable?",
          answer:
            "Select your modules and preferences, then let UMTAS generate a timetable that avoids conflicts where possible.",
        },
        {
          id: "faq_timetable_2",
          question: "Can I export my timetable?",
          answer:
            "Yes. Timetables can be exported to supported calendar formats and services.",
        },
      ],
    },
    {
      id: "faq_imports",
      name: "PDF Imports",
      items: [
        {
          id: "faq_imports_1",
          question: "What PDFs can I upload?",
          answer:
            "UMTAS supports recognised University of Pretoria timetable PDFs for lectures, tests, and exams.",
        },
        {
          id: "faq_imports_2",
          question: "Why did my PDF fail to import?",
          answer:
            "The file may use an unsupported layout or contain timetable data that UMTAS cannot safely interpret.",
        },
      ],
    },
    {
      id: "faq_modules",
      name: "Modules & Events",
      items: [
        {
          id: "faq_modules_1",
          question: "Where do I manage modules?",
          answer:
            "Use Course Management to view modules, events, and related academic information.",
        },
        {
          id: "faq_modules_2",
          question: "Why can I not see a module or event?",
          answer:
            "The module may not belong to your selected university, role, or current enrolments.",
        },
      ],
    },
    {
      id: "faq_attendance",
      name: "Attendance",
      items: [
        {
          id: "faq_attendance_1",
          question: "How does attendance work?",
          answer:
            "Lecturers can start an attendance session and record students using barcode, camera, or NFC tools.",
        },
        {
          id: "faq_attendance_2",
          question: "How do NFC stickers work?",
          answer:
            "Register a sticker once, then scan it during supported attendance sessions to record attendance.",
        },
      ],
    },
    {
      id: "faq_lecture_watch",
      name: "Lecture Watch",
      items: [
        {
          id: "faq_lecture_watch_1",
          question: "What is Lecture Watch?",
          answer:
            "Lecture Watch analyses classroom activity such as attention, movement, and participation using the vision model.",
        },
        {
          id: "faq_lecture_watch_2",
          question: "Why is Lecture Watch not starting?",
          answer:
            "Check that the vision models are prepared, WebGPU is available, and camera permission has been granted.",
        },
      ],
    },
    {
      id: "faq_maps",
      name: "Maps & Venues",
      items: [
        {
          id: "faq_maps_1",
          question: "What can I use the campus map for?",
          answer:
            "The map can help you find university venues, view routes, and understand activity around campus.",
        },
        {
          id: "faq_maps_2",
          question: "Why is a venue missing?",
          answer:
            "Some venues may not yet be linked to a recognised building or map location.",
        },
      ],
    },
  ],
};

const HelpCentrePage = () => {
  return (
    <>
      <Tutorial steps={steps} wait={true} />
      <main className="max-w-[1280px] mx-auto py-12 px-6 md:px-8">
        <div className="mb-12 space-y-4">
          <h1 className="text-[32px] font-semibold leading-[1.2] text-primary tracking-normal">
            Help Centre
          </h1>
          <p className="text-[14px] font-normal leading-[1.6] text-primary max-w-2xl">
            Find quick answers about timetables, modules, attendance, Lecture
            Watch, maps, and other UMTAS features.
          </p>
        </div>

        <div id="faq-categories" className="space-y-12 max-w-4xl">
          {johanHierisDieData.categories.map((category) => (
            <FaqCategorySection key={category.id} category={category} />
          ))}
        </div>
      </main>
    </>
  );
};

export default HelpCentrePage;
