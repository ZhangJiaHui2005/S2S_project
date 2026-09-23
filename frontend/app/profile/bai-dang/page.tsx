import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import MyItemsClient from "./my-items-client";

export default async function MyItemsPage() {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/dang-nhap?returnUrl=/profile/bai-dang");
  }

  return <MyItemsClient user={session.user} />;
}
