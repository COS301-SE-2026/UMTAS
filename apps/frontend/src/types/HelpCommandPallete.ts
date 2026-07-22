import { IconName } from "react-cmdk";
//we can easily extend this interface for demo 2,3,4-> just need to mess around with the cmdk options for links/actions etc
export interface HelpPageItem {
  id: string;
  children: string;
  icon: IconName;
  href: string;
}

export interface HelpPageGroup {
  heading: string;
  id: string;
  items: HelpPageItem[];
}
