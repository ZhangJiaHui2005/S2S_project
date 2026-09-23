import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock, RefreshCw, ServerCrash, ShieldAlert } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Category, fetchCategories } from "@/lib/categories";
import { fetchItemForManage } from "@/lib/items";
import EditItemClient from "./edit-item-client";

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const session = await getCurrentSession();
  const resolvedParams = await params;
  const itemId = Number(resolvedParams.id);

  if (!session || !session.user) {
    redirect(`/dang-nhap?returnUrl=/profile/bai-dang/${itemId}/chinh-sua`);
  }

  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") ?? "";

  let categories: Category[] = [];
  let categoriesError: string | null = null;
  try {
    categories = await fetchCategories({ cookie: cookieHeader });
  } catch (err: unknown) {
    categoriesError = err instanceof Error ? err.message : "Không thể tải danh mục";
  }

  const manageResult = await fetchItemForManage(itemId, { cookie: cookieHeader });

  if (categoriesError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-destructive">
              Lỗi tải danh mục sản phẩm
            </h1>
            <p className="text-sm text-muted-foreground">
              {categoriesError}
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/profile/bai-dang/${itemId}/chinh-sua`} className={buttonVariants({ variant: "default" })}>
                <RefreshCw className="mr-1.5 size-4" /> Thử lại
              </Link>
              <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
                <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (manageResult.status === 403) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-destructive">
              Không có quyền chỉnh sửa
            </h1>
            <p className="text-sm text-muted-foreground">
              Bạn không phải là chủ sở hữu của bài đăng này và không thể thực hiện chỉnh sửa.
            </p>
            <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách bài đăng
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (manageResult.status === 409 || (manageResult.item && manageResult.item.status !== "AVAILABLE")) {
    const itemStatus = manageResult.item?.status ?? "Đang xử lý";
    const statusNote = itemStatus === "LOCKED"
      ? "Bài đăng hiện đang trong tiến trình giao dịch mượn/bán."
      : itemStatus === "EXCHANGED"
      ? "Bài đăng này đã hoàn tất trao đổi thành công."
      : `Bài đăng hiện ở trạng thái ${itemStatus}.`;

    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              <Clock className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
              Không thể chỉnh sửa bài đăng
            </h1>
            <p className="text-sm text-muted-foreground">
              {statusNote} Chỉ những bài đăng ở trạng thái Khả dụng (AVAILABLE) mới có thể chỉnh sửa nội dung hoặc giá.
            </p>
            <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách bài đăng
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (manageResult.status === 404) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-muted">
          <CardContent className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">
              Bài đăng không tồn tại hoặc đã bị xóa
            </h1>
            <p className="text-sm text-muted-foreground">
              Không tìm thấy bài đăng có mã số #{itemId} trong hệ thống.
            </p>
            <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách bài đăng
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (manageResult.status >= 500) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ServerCrash className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-destructive">
              Lỗi máy chủ ({manageResult.status})
            </h1>
            <p className="text-sm text-muted-foreground">
              Không thể tải thông tin bài đăng do lỗi hệ thống phía máy chủ. Vui lòng thử lại sau.
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/profile/bai-dang/${itemId}/chinh-sua`} className={buttonVariants({ variant: "default" })}>
                <RefreshCw className="mr-1.5 size-4" /> Thử lại
              </Link>
              <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
                <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!manageResult.item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-none border-muted">
          <CardContent className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">
              Không thể tải thông tin bài đăng
            </h1>
            <Link href="/profile/bai-dang" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-1.5 size-4" /> Quay lại danh sách bài đăng
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <EditItemClient item={manageResult.item} categories={categories} />;
}
