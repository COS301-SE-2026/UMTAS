import { UserDetails } from "@/lib/userclass/userClass";
import { useRouter } from "next/navigation";

export default function CourseManagement() {
  const router = useRouter();
  const UniDetails = UserDetails.getUniDetails();

  if (UniDetails === null) {
    router.push("choose-institute");
  }

  return <div></div>;
}
