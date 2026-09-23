# Kết quả sửa Item Review Round 4

## Đã sửa

- Migration 6 bỏ ngoại lệ `item_id = 10` và mốc thời gian dự phòng cố định. Khi không thấy lịch sử migration 3 hoàn tất, SQL dừng bằng lỗi thay vì đoán nguồn giá.
- Bài karma tạo trước khi đổi cột được giữ `karma_value` và đặt `price_confirmed = false`, trừ bài đã có giá VND khác giá karma và được sửa sau thời điểm đổi cột.
- Bài VND tạo sau khi đổi cột nhưng bị migration 5 gán nhầm `karma_value` được khôi phục `price_confirmed = true`, `karma_value = null` không dựa vào ngưỡng giá.
- Test migration chạy **file SQL thực tế** của migration 3, 4, 5, 6 trên schema ngẫu nhiên cô lập; kiểm tra cả lỗi khi thiếu lịch sử, ID 10 là karma cũ, giá VND 0/500/5.000.000 và API công khai.
- Runner test không còn tái tạo Prisma Client theo URL schema test; dọn schema chỉ khi đã tạo thành công. Tên test DELETE và chú thích service được sửa để không tuyên bố đã xử lý race với API tạo yêu cầu trong tương lai.
- Trang Next.js thật đã được mở ở desktop và mobile: sidebar trái, Sheet mobile, URL lọc và trạng thái rỗng hoạt động.

## Kết quả kiểm tra

- Backend: typecheck, lint, 29 unit tests, build đều đạt.
- Frontend: typecheck, lint, build Webpack đạt (13 route). Build trong sandbox lỗi khi Next đọc output TypeScript; cùng lệnh ngoài sandbox đạt.
- Migration trên schema test: 4/4 test đạt, schema đã xóa.
- E2E trên schema test: 23 đạt, 1 bỏ qua, schema đã xóa. Test này chỉ chứng minh hai DELETE đồng thời; chưa có API tạo BorrowRequest/Transaction để test race tạo request cùng lúc với DELETE.

## Chưa triển khai Neon

1. `prisma migrate status` cho thấy migration 6 chưa chạy. Lịch sử Neon còn hai migration `20260827_payos_payment_tables` và `20260903_payment_archive` không có file trong repo. Cần khôi phục đúng hai file lịch sử trước khi `prisma migrate deploy`, tránh lịch sử migration lệch.
2. Audit chỉ đọc cho thấy item 10 có `created_at` trước migration 3, `karma_value = null`, `price_confirmed = true`, giá 5.000.000 VND. Bản ghi không có dấu xác minh giá độc lập. Migration bảo thủ sẽ tạm ẩn item 10; chủ bài có thể xác nhận lại VND trong trang sửa bài. Không đưa ID 10 vào ngoại lệ chung khi chưa có chứng cứ.
3. Chưa chạy migration 6 trên `public` và chưa sửa dữ liệu Item thật. Có thể xem trước tác động bằng `cd backend && node scripts/preview-item-price-migration.mjs` (chỉ đọc). Trước khi triển khai, lưu snapshot/branch DB và đối chiếu kết quả preview với chủ dữ liệu.
