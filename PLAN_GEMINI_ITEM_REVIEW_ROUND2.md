# Các lỗi còn lại sau báo cáo Item Review Fix

## 1. Chặn xác nhận nhầm giá cũ (P0)

- `backend/src/item/item.service.ts` hiện đặt `price_confirmed: true` cho **mọi** PATCH, kể cả chỉ sửa tiêu đề. `frontend/components/items/item-form.tsx` lại điền sẵn `price_vnd` từ số cũ khi bài chưa xác nhận. Vì vậy chủ bài có thể bấm Lưu mà không nhập giá VND mới, khiến bài cũ xuất hiện công khai với giá sai.
- Với item `price_confirmed=false`, form phải để trống ô giá và hiển thị yêu cầu nhập giá VND mới; card và chi tiết của chủ bài phải hiển thị “Cần xác nhận giá” thay cho số cũ. Backend chỉ chuyển cờ sang `true` khi nhận giá VND được xác nhận rõ ràng; PATCH trường khác không được mở bài. Dùng contract xác nhận riêng nếu cần để phân biệt giá mới với dữ liệu cũ. Test tình huống PATCH `{ title: ... }` và mở form rồi lưu mà chưa nhập giá.
- `findAll()`/`findMine()`/`findOne()` hiện trả nguyên Prisma Item nên payload có cả `karma_value`. Chọn các trường API cần dùng và không gửi giá cũ cho frontend người dùng. Với bài chưa xác nhận, tránh trả `price_vnd` như giá hợp lệ trong UI.

## 2. Migration và dữ liệu ngoài Neon hiện tại (P1)

- Migration 4 chỉ gắn cờ item ID `4, 5, 11`. Neon hiện tại có đúng 4 item, ba ID này đã `price_confirmed=false`; xác minh này chỉ đúng cho DB hiện tại. Các môi trường khác có item cũ với ID khác sẽ không được bảo vệ.
- Không sửa migration 3/4 đã áp dụng. Tạo preflight/audit và migration hoặc backfill tiếp theo có quy tắc rõ ràng cho từng môi trường: mọi item có giá nguồn chưa được xác nhận phải ẩn công khai cho tới khi chủ nhập VND thật. Không suy từ ID cố định hoặc lấy số cũ làm giá mới. Báo số lượng item cũ chưa xác nhận ở từng DB trước và sau triển khai.

## 3. Quyền sửa theo trạng thái và lỗi tải dữ liệu (P1/P2)

- `frontend/app/profile/bai-dang/[id]/chinh-sua/page.tsx` hiện kiểm tra quyền chủ bài nhưng không kiểm tra `status=AVAILABLE`; chủ bài `LOCKED` hoặc `EXCHANGED` vẫn thấy form rồi nhận `409` lúc lưu. Chặn trước khi render form và hiển thị trạng thái phù hợp. Backend giữ kiểm tra riêng.
- Route sửa bài đang `.catch(() => [])` khi tải danh mục, nên lỗi mạng biến thành form không có danh mục mà không có nút thử lại. Hiển thị lỗi và cách tải lại. `fetchItemForManage()` trả `500` nhưng trang lại hiển thị như `404`; tách lỗi server khỏi “không tồn tại”.

## 4. Kiểm thử đúng tình huống thật (P1)

- `backend/test/item.e2e-spec.ts` kiểm thử tiêu đề toàn khoảng trắng khi **không có session** và chấp nhận cả `400` lẫn `401`; test này chưa chứng minh validation của người dùng đăng nhập. Test phân quyền A/B cũng chưa có trong e2e. Thêm test với hai tài khoản thật trong DB test cô lập, kiểm tra status chính xác cho tạo/sửa/xóa, giá cũ chưa xác nhận, xác nhận giá, `LOCKED`, và phân trang hơn 12 bài. Không dựa vào ID cố định của Neon.
- `remove()` vẫn đếm yêu cầu/giao dịch rồi mới ghi trạng thái; `updateMany` chỉ bảo vệ khi `Item.status` đổi, không ngăn một `BorrowRequest` mới xuất hiện giữa hai bước nếu bên tạo request không khóa item. Nếu quy trình mượn có thể làm vậy, phối hợp transaction/điều kiện trạng thái với module yêu cầu mượn và test cạnh tranh.
- Báo riêng kết quả `npm run build` mặc định và `next build --webpack`. Trên môi trường review này Turbopack vẫn lỗi do không tạo được process/bind port; Webpack build qua. Không ghi Turbopack “đã qua” nếu không có log từ cùng môi trường.

## Báo cáo Gemini cần gửi lại

Với mỗi mục trên: file sửa, cách tái hiện trước/sau, test và log tương ứng, số lượng item chưa xác nhận còn lại, kết quả migration trên DB test và DB đích, ảnh chụp trang duyệt 3 card/hàng ở desktop và mobile. Không chạy migration ghi dữ liệu hoặc reset DB thật trước khi có cách phân loại giá cũ đã được chủ dự án chốt.
