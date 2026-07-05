// this is to manage a user
// basically a singleton to fetch data
// Store current university dto with all the localstorage handled

import { uniDto } from "@/components/templates/choose-institute/queries/builders";

export class UserDetails {
  private static instance: UserDetails;
  private uniKey = "universityDetails";
  private constructor() {
    console.log("User initialized");
  }

  public static getInstance(): UserDetails {
    if (!this.instance) {
      this.instance = new UserDetails();
    }
    return this.instance;
  }
  public storeUniDetails(details?: uniDto) {
    if (!details) return;

    const data = JSON.stringify(details);
    localStorage.setItem(this.uniKey, data);
    console.log("University stored", details);
  }
  public getUniDetails(): uniDto | undefined {
    const storedItem = localStorage.getItem(this.uniKey);
    if (storedItem) {
      const data = JSON.parse(storedItem);
      return data as uniDto;
    }
    return undefined;
  }
}
