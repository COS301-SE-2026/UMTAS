// this is to manage a user
// basically a singleton to fetch data
// Store current university dto with all the localstorage handled

import { uniDto } from "@/components/templates/choose-institute/queries/builders";

export class UserDetails {
  private static uniKey = "universityDetails";
  private static checkWindow() {
    if (typeof window !== "undefined") {
      return true;
    } else return false;
  }

  public static storeUniDetails(details?: uniDto) {
    if (!details || !this.checkWindow()) return;
    const data = JSON.stringify(details);
    localStorage.setItem(this.uniKey, data);
    console.log("University stored", details);
  }
  public static getUniDetails(): uniDto | undefined {
    if (!this.checkWindow()) return undefined;

    const storedItem = localStorage.getItem(this.uniKey);

    if (storedItem) {
      const data = JSON.parse(storedItem);
      return data as uniDto;
    }

    return undefined;
  }
}
