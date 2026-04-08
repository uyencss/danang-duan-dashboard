# Task 25: Triển khai Email Service

## Mục tiêu
Tích hợp dịch vụ gởi email thông qua SMTP của TinoGroup (`smtp.tino.vn`), sử dụng tài khoản `admin@gpsdna.io.vn`. Mục tiêu cốt lõi là để ứng dụng có một API endpoint hoặc Utility function dùng chung mỗi khi cần gởi mail (ví dụ: thông báo hệ thống, báo cáo, v.v.).

## Các thông số Server đã cấu hình
- **SMTP Host**: `smtp.tino.vn`
- **SMTP Port**: `587` (hoặc `465` tuỳ thuộc vào library support)
- **SMTP User**: `admin@gpsdna.io.vn`
- **SMTP Password**: [Bảo mật qua `.env`]
- **Security**: `STARTTLS` / `SSL`

## Công việc cụ thể

1. **Cài đặt thư viện**
   - Thêm `nodemailer` để hỗ trợ gửi mail:
     ```bash
     npm install nodemailer
     npm install -D @types/nodemailer
     ```

2. **Tạo Cấu hình & Utility gởi mail (`src/lib/email.ts`)**
   - Tạo transporter bằng các biến môi trường cấu hình SMTP (từ `process.env`).
   - Viết hàm `sendEmail({ to, subject, html, text })` để tái sử dụng ở bất kỳ đâu trong ứng dụng.

3. **Thiết lập API Route cho chức năng gửi mail**
   - Tạo endpoint `POST /api/email/send`.
   - Bảo mật: Yêu cầu xác thực phiên đăng nhập (chỉ user đã đăng nhập, và có quyền tương ứng mới được trigger API này để tránh spam).
   - Truyền tham số email đến, tiêu đề, và nội dung qua body request.

4. **Tích hợp tính năng hiện tại (Tuỳ chọn)**
   - Liên kết chức năng gởi mail vào thông báo các task/dự án trong hệ thống.
   - Thử gọi hàm gởi email khi một Dự án mới được tạo, hay khi có Comment (tùy vào luồng xử lý thực tế).

5. **Kiểm tra/Test**
   - Đảm bảo mail không rơi vào hòm thư giác.
   - Kiểm tra log trên server Docker (`docker compose logs`) khi email gởi lỗi.
