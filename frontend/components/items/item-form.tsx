"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/lib/categories";
import { CreateItemPayload, Item, ItemType, UpdateItemPayload } from "@/lib/items";

interface ItemFormProps {
  initialData?: Item;
  categories: Category[];
  onSubmit: (payload: CreateItemPayload | UpdateItemPayload) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ItemForm({
  initialData,
  categories,
  onSubmit,
  isSubmitting,
  onCancel,
}: ItemFormProps) {
  const isUnconfirmed = initialData?.price_confirmed === false;

  const [type, setType] = useState<ItemType>(initialData?.type || "SELL");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState<number | "">(
    initialData?.category_id || (categories.length > 0 ? categories[0].category_id : "")
  );
  const [priceVnd, setPriceVnd] = useState<string>(() => {
    if (initialData) {
      if (initialData.price_confirmed === false) {
        return "";
      }
      return initialData.price_vnd !== null && initialData.price_vnd !== undefined
        ? initialData.price_vnd.toString()
        : "";
    }
    return "0";
  });
  const [location, setLocation] = useState(initialData?.location || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
      setFormError("Tiêu đề phải từ 2 đến 200 ký tự.");
      return;
    }

    if (!categoryId) {
      setFormError("Vui lòng chọn danh mục.");
      return;
    }

    if (isUnconfirmed && priceVnd.trim() === "") {
      setFormError("Bài đăng này chưa xác nhận giá VND. Vui lòng nhập giá VND thật để hoàn tất.");
      return;
    }

    if (
      priceVnd.trim() === "" ||
      priceVnd.includes(".") ||
      priceVnd.includes(",") ||
      !Number.isInteger(Number(priceVnd))
    ) {
      setFormError("Giá phải là số nguyên (VND), không chứa phần thập phân.");
      return;
    }

    const price = Number(priceVnd);
    if (isNaN(price) || price < 0 || price > 1000000000) {
      setFormError("Giá VND phải từ 0 đến 1.000.000.000 VND.");
      return;
    }

    if (imageUrl.trim()) {
      try {
        const parsed = new URL(imageUrl.trim());
        if (parsed.protocol !== "https:") {
          setFormError("URL hình ảnh phải sử dụng giao thức HTTPS (bắt đầu bằng https://).");
          return;
        }
      } catch {
        setFormError("URL hình ảnh không hợp lệ (phải bắt đầu bằng https://).");
        return;
      }
    }

    const payload: CreateItemPayload = {
      type,
      title: trimmedTitle,
      description: description.trim() || undefined,
      category_id: Number(categoryId),
      price_vnd: price,
      location: location.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu bài đăng.";
      setFormError(message);
    }
  };

  const hasNoCategories = categories.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasNoCategories && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Chưa có danh mục</AlertTitle>
          <AlertDescription>
            Không thể tải danh mục hoặc chưa có danh mục khả dụng trên hệ thống. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {isUnconfirmed && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Yêu cầu xác nhận giá VND</AlertTitle>
          <AlertDescription>
            Bài đăng này được chuyển đổi từ hệ thống cũ và chưa có giá VND thực tế. Ô giá đã được để trống. Bạn cần nhập giá VND thật và bấm Lưu để bài đăng được mở duyệt và hiển thị công khai trên hệ thống.
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="item-type">Hình thức chia sẻ *</Label>
          <NativeSelect
            id="item-type"
            value={type}
            onChange={(e) => setType(e.target.value as ItemType)}
            disabled={isSubmitting || hasNoCategories}
          >
            <option value="SELL">Bán (Trả phí một lần)</option>
            <option value="LEND">Cho mượn (Trả phí / lượt mượn)</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-category">Danh mục *</Label>
          <NativeSelect
            id="item-category"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            disabled={isSubmitting || hasNoCategories}
          >
            <option value="" disabled>-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-title">Tiêu đề bài đăng *</Label>
        <Input
          id="item-title"
          placeholder="Ví dụ: Giáo trình Triết học Mác - Lênin (mới 95%)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting || hasNoCategories}
          maxLength={200}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="item-price" className="flex items-center gap-2">
            <span>Giá niêm yết (VND) *</span>
            {isUnconfirmed && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                (Bắt buộc nhập mới)
              </span>
            )}
          </Label>
          <Input
            id="item-price"
            type="number"
            step="1"
            placeholder={isUnconfirmed ? "Nhập giá VND thực tế (bắt buộc)" : "0"}
            value={priceVnd}
            onChange={(e) => setPriceVnd(e.target.value)}
            disabled={isSubmitting || hasNoCategories}
            min={0}
            max={1000000000}
          />
          <p className="text-xs text-muted-foreground">
            {type === "LEND" ? "Giá tính cho 1 lượt mượn." : "Giá bán niêm yết."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-location">Địa điểm giao nhận</Label>
          <Input
            id="item-location"
            placeholder="Ví dụ: Cổng chính KTX Khu A, ĐHQG"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSubmitting || hasNoCategories}
            maxLength={250}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-description">Mô tả chi tiết</Label>
        <Textarea
          id="item-description"
          placeholder="Mô tả tình trạng sản phẩm, phụ kiện đi kèm, điều kiện mượn..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting || hasNoCategories}
          rows={4}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-image">URL Hình ảnh (HTTPS)</Label>
        <Input
          id="item-image"
          type="url"
          placeholder="https://example.com/hinh-anh.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isSubmitting || hasNoCategories}
        />
        <p className="text-xs text-muted-foreground">
          Dán liên kết hình ảnh HTTPS công khai của sản phẩm (hoặc để trống nếu chưa có ảnh).
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting || hasNoCategories}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang lưu...
            </>
          ) : initialData ? (
            "Cập nhật bài đăng"
          ) : (
            "Đăng bài viết"
          )}
        </Button>
      </div>
    </form>
  );
}
