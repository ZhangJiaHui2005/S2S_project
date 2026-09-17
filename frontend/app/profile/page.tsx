import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/dang-nhap");
  }

  return <ProfileClient user={session.user} session={session.session} />;
}
