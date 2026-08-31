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
    if (details == undefined && this.checkWindow()) {
      localStorage.setItem(this.uniKey, "");
    }

    if (!details || !this.checkWindow()) return;
    const data = JSON.stringify(details);
    localStorage.setItem(this.uniKey, data);

    window.dispatchEvent(new Event(this.changeEvent));

    getQueryClient().invalidateQueries();
  }
  public static getUniDetails(): uniDto | undefined {
    if (!this.checkWindow()) return undefined;

    const storedItem = localStorage.getItem(this.uniKey);

    if (storedItem && storedItem != "") {
      const data = JSON.parse(storedItem);
      return data as uniDto;
    }

    return undefined;
  }

  public static userCanEdit() {
    return (
      UserDetails.getUniDetails()?.role === "LECTURER" ||
      UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN"
    );
  }
}
