import { HelpPageSection, HelpStep } from "../../types/HelpPage";

const vmSteps: HelpStep[] = [
  {
    stepNumber: 1,
    title: "Session Details",
    description: `Here you can view all details including questions asked, stillness, and student attention.`,
    imageUrl: `/images/VM/steps/SessionDetails.png`,
  },
  {
    stepNumber: 2,
    title: "Analysis Settings",
    description: `Here you can switch on inference, which will add session details based on the provided camera feed.\n\nA session does not need to be started for session details to be logged.`,
    imageUrl: `/images/VM/steps/AnalysisSettings.png`,
  },
  {
    stepNumber: 3,
    title: "Detection Settings",
    description: `Here you can test the camera setup. It runs faster detection to test the visibility of students.\n\nDetection will not add session details.`,
    imageUrl: `/images/VM/steps/detectionSettings.png`,
  },
  {
    stepNumber: 4,
    title: "Camera Settings",
    description: `Here media devices can be accessed for a session, as well as enabling the camera feed.`,
    imageUrl: `/images/VM/steps/camera.png`,
  },
  {
    stepNumber: 5,
    title: "Media Settings",
    description: `Here you can upload images or access the video panel.\n\nThese images and videos never leave your device and remain only on your browser.`,
    imageUrl: `/images/VM/steps/Media.png`,
  },
  {
    stepNumber: 6,
    title: "Uploading an Image",
    description: `Click Image to upload an image to test on the setup.`,
    imageUrl: `/images/VM/steps/imgUpload.png`,
  },
  {
    stepNumber: 7,
    title: "Video Analysis",
    description: `Click Analyze Video to create a session and run inference on a pre-recorded video.`,
    imageUrl: `/images/VM/steps/VideoUpload.png`,
  },
  {
    stepNumber: 8,
    title: "Create or Choose a Session",
    description: `Create or choose a previous session to re-run the analysis on that session.\n\nThis will clear the session's previous details if re-run.`,
    imageUrl: `/images/VM/steps/SessionCreation.png`,
  },
  {
    stepNumber: 9,
    title: "Selecting a Session",
    description: `Click Use Session to proceed with uploading a video.`,
    imageUrl: `/images/VM/steps/SelectAndUseSession.png`,
  },
  {
    stepNumber: 10,
    title: "Video Inference",
    description: `Once a session is created or selected, you will be redirected to this panel.`,
    imageUrl: `/images/VM/steps/VideoPanel.png`,
  },
  {
    stepNumber: 11,
    title: "Upload Video",
    description: `Select a video and session inference will automatically begin.`,
    imageUrl: `/images/VM/steps/selectVideoBtn.png`,
  },
];

export const vmSection: HelpPageSection = {
  id: "vm",
  title: "Lecture Watch",
  description:
    "Set up a camera or recording and get inference on your students' classroom behavior.",
  pageName: "Lecture Watch",
  pageImage: {
    url: "/images/VM/image.png",
  },
  roles: ["all"],
  steps: vmSteps,
};
