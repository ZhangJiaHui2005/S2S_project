export type ItemType = "SELL" | "LEND";
export type ItemStatus = "AVAILABLE" | "LOCKED" | "EXCHANGED" | "DELETED";

export interface CategorySummary {
  category_id: number;
  name: string;
  icon?: string | null;
}

export interface UserSummary {
  user_id: number;
  full_name: string;
  avatar?: string | null;
}

export interface Item {
  item_id: number;
  owner_id: number;
  category_id: number;
  title: string;
  description?: string | null;
  price_vnd: number | null;
  price_confirmed?: boolean;
  is_owner?: boolean;
  type: ItemType;
  status: ItemStatus;
  location?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  Category?: CategorySummary;
  User?: UserSummary;
}

export interface ItemsResponse {
  data: Item[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateItemPayload {
  type: ItemType;
  title: string;
  description?: string;
  category_id: number;
  price_vnd: number;
  location?: string;
  image_url?: string;
}

export interface UpdateItemPayload {
  type?: ItemType;
  title?: string;
  description?: string;
  category_id?: number;
  price_vnd?: number;
  location?: string;
  image_url?: string;
}

export interface QueryItemsParams {
  q?: string;
  categoryId?: number;
  type?: ItemType;
  minPriceVnd?: number;
  maxPriceVnd?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export async function fetchItems(params: QueryItemsParams = {}): Promise<ItemsResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.categoryId) query.set("categoryId", params.categoryId.toString());
  if (params.type) query.set("type", params.type);
  if (params.minPriceVnd !== undefined) query.set("minPriceVnd", params.minPriceVnd.toString());
  if (params.maxPriceVnd !== undefined) query.set("maxPriceVnd", params.maxPriceVnd.toString());
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  const res = await fetch(`/api/items?${query.toString()}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách vật phẩm");
  }

  return res.json();
}

export async function fetchMyItems(
  params: { page?: number; limit?: number } = {},
  initHeaders?: HeadersInit,
): Promise<ItemsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  let url = `/api/items/mine?${query.toString()}`;
  const options: RequestInit = {
    cache: "no-store",
    credentials: "include",
  };

  if (initHeaders) {
    const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");
    url = `${authServerUrl}/api/items/mine?${query.toString()}`;
    options.headers = initHeaders;
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error("Không thể tải danh sách bài đăng của bạn");
  }

  return res.json();
}

export async function fetchItemById(
  id: number,
  initHeaders?: HeadersInit,
): Promise<Item | null> {
  let url = `/api/items/${id}`;
  const options: RequestInit = {
    cache: "no-store",
    credentials: "include",
  };

  if (initHeaders) {
    const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");
    url = `${authServerUrl}/api/items/${id}`;
    options.headers = initHeaders;
  }

  const res = await fetch(url, options);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Không thể lấy thông tin chi tiết vật phẩm");
  }

  return res.json();
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Không thể tạo bài đăng";
    throw new Error(message);
  }

  return res.json();
}

export async function updateItem(id: number, payload: UpdateItemPayload): Promise<Item> {
  const res = await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Không thể cập nhật bài đăng";
    throw new Error(message);
  }

  return res.json();
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`/api/items/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Không thể xóa bài đăng";
    throw new Error(message);
  }
}

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Cần xác nhận giá";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export async function fetchItemForManage(
  id: number,
  initHeaders?: HeadersInit,
): Promise<{ item: Item | null; status: number }> {
  const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const res = await fetch(`${authServerUrl}/api/items/${id}/manage`, {
    headers: initHeaders,
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    return { item: null, status: res.status };
  }
  if (!res.ok) {
    return { item: null, status: res.status };
  }
  const item = await res.json();
  return { item, status: 200 };
}
