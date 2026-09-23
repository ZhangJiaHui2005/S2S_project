"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Category } from "@/lib/categories";

interface ItemFiltersProps {
  categories: Category[];
  onApplyMobile?: () => void;
}

export function ItemFilters({ categories, onApplyMobile }: ItemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [minPriceVnd, setMinPriceVnd] = useState(searchParams.get("minPriceVnd") || "");
  const [maxPriceVnd, setMaxPriceVnd] = useState(searchParams.get("maxPriceVnd") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (type) params.set("type", type);
    if (minPriceVnd) params.set("minPriceVnd", minPriceVnd);
    if (maxPriceVnd) params.set("maxPriceVnd", maxPriceVnd);
    if (sort && sort !== "newest") params.set("sort", sort);
    params.set("page", "1");

    router.push(`/items?${params.toString()}`);
    if (onApplyMobile) onApplyMobile();
  };

  const handleReset = () => {
    setQ("");
    setCategoryId("");
    setType("");
    setMinPriceVnd("");
    setMaxPriceVnd("");
    setSort("newest");
    router.push("/items");
    if (onApplyMobile) onApplyMobile();
  };

  return (
    <form onSubmit={handleApply} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="filter-search">Từ khóa tìm kiếm</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            id="filter-search"
            placeholder="Tên, mô tả vật phẩm..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-category">Danh mục</Label>
        <NativeSelect
          id="filter-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-type">Loại vật phẩm</Label>
        <NativeSelect
          id="filter-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tất cả (Bán & Mượn)</option>
          <option value="SELL">Bán</option>
          <option value="LEND">Cho mượn</option>
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label>Khoảng giá (VND)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Tối thiểu"
            value={minPriceVnd}
            onChange={(e) => setMinPriceVnd(e.target.value)}
            min={0}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Tối đa"
            value={maxPriceVnd}
            onChange={(e) => setMaxPriceVnd(e.target.value)}
            min={0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-sort">Sắp xếp theo</Label>
        <NativeSelect
          id="filter-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" className="w-full">
          Áp dụng bộ lọc
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="w-full gap-1.5"
        >
          <FilterX className="size-4" /> Xóa bộ lọc
        </Button>
      </div>
    </form>
  );
}
