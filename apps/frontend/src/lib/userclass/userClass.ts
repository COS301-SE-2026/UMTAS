// this is to manage a user
// basically a singleton to fetch data
// Store current university dto with all the localstorage handled

import { uniDto } from "@/app/choose-institute/queries/builders";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

export class UserDetails {
  private static uniKey = "universityDetails";
  public static changeEvent = "unidetails-changed";
  private static checkWindow() {
    if (typeof window !== "undefined") {
      return true;
    } else return false;
  }

  public static storeUniDetails(details?: uniDto | undefined) {
    if (!this.checkWindow()) return;
    if (!details) {
      this.clearUniDetails();
      return;
    }
    const data = JSON.stringify(details);
    localStorage.setItem(this.uniKey, data);

    window.dispatchEvent(new Event(this.changeEvent));

    getQueryClient().invalidateQueries();
  }
  public static getUniDetails(): uniDto | undefined {
    if (!this.checkWindow()) return undefined;

    const storedItem = localStorage.getItem(this.uniKey);

    if (storedItem) {
      try {
        return JSON.parse(storedItem) as uniDto;
      } catch {
        this.clearUniDetails();
      }
    }

    return undefined;
  }

  public static clearUniDetails() {
    if (!this.checkWindow()) return;

    localStorage.removeItem(this.uniKey);
    document.cookie = "umtas-uni-id=; Path=/; Max-Age=0; SameSite=Lax";
    window.dispatchEvent(new Event(this.changeEvent));
    getQueryClient().invalidateQueries();
  }

  public static userCanEdit() {
    return (
      UserDetails.getUniDetails()?.role === "LECTURER" ||
      UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN"
    );
  }
}
