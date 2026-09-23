export interface Category {
  category_id: number;
  name: string;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchCategories(initHeaders?: HeadersInit): Promise<Category[]> {
  let url = "/api/categories";
  const options: RequestInit = {
    cache: "no-store",
  };
  if (initHeaders) {
    const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");
    url = `${authServerUrl}/api/categories`;
    options.headers = initHeaders;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error("Không thể tải danh sách danh mục. Vui lòng thử lại.");
  }
  return res.json();
}
