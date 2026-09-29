import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const attendanceSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "View Classes",
    description: `View all todays classes`,
    imageUrl: `/images/Attendance/steps/viewClasses.png`,
  },
  {
    stepNumber: 2,
    title: "NFC attendance",
    description: `Click nfc attendance`,
    imageUrl: `/images/Attendance/steps/clickNFCAttend.png`,
  },
  {
    stepNumber: 3,
    title: "NFC page",
    description: ``,
    imageUrl: `/images/Attendance/steps/nfcpage.png`,
  },
  {
    stepNumber: 4,
    title: "Register Sticker",
    description: `Click register sticker to start create a tag for nfc`,
    imageUrl: `/images/Attendance/steps/register.png`,
  },
  {
    stepNumber: 5,
    title: "NFC options",
    description: `Finalize details about NFC registration`,
    imageUrl: `/images/Attendance/steps/finalizeReg.png`,
  },
  {
    stepNumber: 6,
    title: "Barcode Attendance",
    description: `Click on Barcode attendance`,
    imageUrl: `/images/Attendance/steps/barcodeAttendance.png`,
  },
  {
    stepNumber: 7,
    title: "Student List",
    description: `Submit a list of student numbers for the session`,
    imageUrl: `/images/Attendance/steps/numList.png`,
  },
  {
    stepNumber: 8,
    title: "Start session",
    description: `Click start session to begin the attendance session`,
    imageUrl: `/images/Attendance/steps/startscanning.png`,
  },
  {
    stepNumber: 9,
    title: "Scanning",
    description: `A camera will appear for you to begin scanning`,
    imageUrl: `/images/Attendance/steps/manualcam.png`,
  },
  {
    stepNumber: 10,
    title: "Finish session",
    description: `Click end session to Finish the session off `,
    imageUrl: `/images/Attendance/steps/finishsession.png`,
  },
];

export const attendanceSection: HelpPageSection = {
  id: "attendance",
  title: "Attendance",
  description: "Manage and track class attendance",
  pageName: "Attendance Page",
  pageImage: {
    url: "/images/Attendance/image.png",
  },
  roles: ["all"],
  steps: attendanceSteps,
};
