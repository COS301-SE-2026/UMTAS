export type NavigationRole = "UNIVERSITY_ADMIN" | "STUDENT" | "LECTURER";

export type NavigationSection =
  "primary" | "actions" | "admin" | "help" | "auth";

export type NavigationAction = "run-page-tutorial" | "run-cmdk-tutorial";

export type NavigationIcon =
  | "HomeIcon"
  | "CalendarIcon"
  | "ClockIcon"
  | "MapIcon"
  | "BookOpenIcon"
  | "AdjustmentsHorizontalIcon"
  | "CalendarDaysIcon"
  | "AcademicCapIcon"
  | "UserGroupIcon"
  | "ChartBarIcon"
  | "SwatchIcon"
  | "QuestionMarkCircleIcon"
  | "PlayIcon"
  | "InformationCircleIcon"
  | "ArrowRightOnRectangleIcon"
  | "UserPlusIcon"
  | "KeyIcon"
  | "ArrowPathIcon";

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  action?: NavigationAction;

  section: NavigationSection;

  icon: NavigationIcon;
  tourContent: string;

  keywords?: string[];

  roles?: NavigationRole[];

  requiresUniversity?: boolean;
  universities?: string[];

  showInNavbar: boolean;
  showInCommandPalette: boolean;
}

export interface NavigationContext {
  role?: string;
  universityName?: string;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    section: "primary",
    icon: "HomeIcon",
    tourContent: "Jump straight to your Dashboard from here.",
    keywords: ["home", "dashboard"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "builder",
    label: "Timetable Builder",
    href: "/builder",
    section: "primary",
    icon: "CalendarIcon",
    tourContent: "Open the Timetable Builder to start building your schedules.",
    keywords: ["builder", "timetable", "schedule builder", "event builder"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "schedules",
    label: "Schedules",
    href: "/schedules",
    section: "primary",
    icon: "ClockIcon",
    tourContent: "View all your saved schedules here.",
    keywords: ["schedule", "schedules", "saved schedules"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "module-management",
    label: "Module Management",
    href: "/module-management",
    section: "actions",
    icon: "BookOpenIcon",
    tourContent: "Manage your university modules and events here.",
    keywords: ["modules", "module management", "events", "manage events"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "map",
    label: "Map",
    href: "/map",
    section: "actions",
    icon: "MapIcon",
    tourContent: "Open the university map.",
    keywords: ["map", "campus", "locations", "venues"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "solver",
    label: "Timetable Solver",
    href: "/solver",
    section: "actions",
    icon: "AdjustmentsHorizontalIcon",
    tourContent: "Upload timetable information and use the Timetable Solver.",
    keywords: ["solver", "timetable solver", "upload pdf", "pdf"],
    requiresUniversity: true,
    universities: ["University of Pretoria"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "course-management",
    label: "Course Management",
    href: "/course-management",
    section: "admin",
    icon: "AcademicCapIcon",
    tourContent: "Manage university courses.",
    keywords: ["courses", "course management"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "role-management",
    label: "Role Management",
    href: "/role-management",
    section: "admin",
    icon: "UserGroupIcon",
    tourContent: "Manage user roles and permissions.",
    keywords: ["roles", "users", "permissions", "role management"],
    roles: ["UNIVERSITY_ADMIN"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "calendar-management",
    label: "Calendar Management",
    href: "/calendar-management",
    section: "admin",
    icon: "CalendarDaysIcon",
    tourContent: "Manage university calendars.",
    keywords: ["calendar", "calendars", "calendar management"],
    roles: ["UNIVERSITY_ADMIN"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "stats",
    label: "Statistics",
    href: "/stats",
    section: "admin",
    icon: "ChartBarIcon",
    tourContent: "View application statistics and insights.",
    keywords: ["statistics", "stats", "analytics", "insights"],
    roles: ["UNIVERSITY_ADMIN"],
    requiresUniversity: true,
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "brand-style",
    label: "Brand Style",
    href: "/brand-style",
    section: "help",
    icon: "SwatchIcon",
    tourContent: "View the application's brand and design system.",
    keywords: ["brand", "style", "design", "theme"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "faq",
    label: "Frequently Asked Questions",
    href: "/faq",
    section: "help",
    icon: "QuestionMarkCircleIcon",
    tourContent: "Check the FAQ for answers to common questions.",
    keywords: ["faq", "questions", "help"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "user-manual",
    label: "User Manual",
    href: "/tutorial",
    section: "help",
    icon: "BookOpenIcon",
    tourContent: "Open the full UMTAS user manual.",
    keywords: ["manual", "tutorial", "documentation", "help"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "run-tutorial",
    label: "Run Tutorial for this Page",
    action: "run-page-tutorial",
    section: "help",
    icon: "PlayIcon",
    tourContent:
      "Run the interactive tutorial for the page you are currently viewing.",
    keywords: ["tutorial", "tour", "help", "walkthrough"],
    showInNavbar: true,
    showInCommandPalette: true,
  },

  {
    id: "cmdk-tutorial",
    label: "How to use the Help Menu",
    action: "run-cmdk-tutorial",
    section: "help",
    icon: "InformationCircleIcon",
    tourContent: "Learn how to navigate and use the Command-K Help Menu.",
    keywords: ["command k", "command palette", "help menu", "tutorial"],
    showInNavbar: true,
    showInCommandPalette: true,
  },
  {
    id: "login",
    label: "Login",
    href: "/login",
    section: "auth",
    icon: "ArrowRightOnRectangleIcon",
    tourContent: "Go to the Login page.",
    keywords: ["login", "sign in"],
    showInNavbar: false,
    showInCommandPalette: true,
  },

  {
    id: "register",
    label: "Register",
    href: "/register",
    section: "auth",
    icon: "UserPlusIcon",
    tourContent: "Register a new account.",
    keywords: ["register", "account", "sign up"],
    showInNavbar: false,
    showInCommandPalette: true,
  },

  {
    id: "forgot-password",
    label: "Forgot Password",
    href: "/forgot-password",
    section: "auth",
    icon: "KeyIcon",
    tourContent: "Recover access if you've forgotten your password.",
    keywords: ["forgot password", "password", "recover account"],
    showInNavbar: false,
    showInCommandPalette: true,
  },

  {
    id: "reset-password",
    label: "Reset Password",
    href: "/reset-password",
    section: "auth",
    icon: "ArrowPathIcon",
    tourContent: "Reset your account password.",
    keywords: ["reset password", "password"],
    showInNavbar: false,
    showInCommandPalette: true,
  },
];

export function canAccessNavigationItem(
  item: NavigationItem,
  context: NavigationContext,
): boolean {
  if (item.roles?.length) {
    if (!context.role || !item.roles.includes(context.role as NavigationRole)) {
      return false;
    }
  }

  if (item.requiresUniversity && !context.universityName) {
    return false;
  }

  if (
    item.universities?.length &&
    (!context.universityName ||
      !item.universities.includes(context.universityName))
  ) {
    return false;
  }

  return true;
}

export function getVisibleNavigationItems(
  context: NavigationContext,
): NavigationItem[] {
  return navigationItems.filter((item) =>
    canAccessNavigationItem(item, context),
  );
}

export function executeNavigationAction(action: NavigationAction): void {
  switch (action) {
    case "run-page-tutorial":
      window.dispatchEvent(new Event("begin-tut"));
      return;

    case "run-cmdk-tutorial":
      window.dispatchEvent(new Event("request-cmdk-tut"));
      return;
  }
}
