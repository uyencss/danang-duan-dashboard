import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, demand } = body;

    // Log the consultation request to the server console/logs
    const vnTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log('\n====================================');
    console.log('📢 YÊU CẦU TƯ VẤN B2B MỚI (VR360)');
    console.log(`- Họ tên: ${name || '(Không nhập)'}`);
    console.log(`- Số điện thoại: ${phone}`);
    console.log(`- Nhu cầu: ${demand || '(Không nhập)'}`);
    console.log(`- Thời gian: ${vnTime}`);
    console.log('====================================\n');

    // Send email notifications
    const recipients = [
      'my.nguyentra@mobifone.vn',
      'vuong.tuan@mobifone.vn',
      'uyen.bao@mobifone.vn',
      'uyencss1@gmail.com'
    ];

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #0055a5; border-bottom: 2px solid #00aaee; padding-bottom: 8px;">📢 Yêu cầu tư vấn B2B mới từ trang VR360 (Hidden Horizons)</h3>
        <p>Hệ thống nhận được yêu cầu đăng ký tư vấn mới với chi tiết như sau:</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; border-color: #ddd;">
          <tr style="background-color: #f8fcff;">
            <th align="left" style="width: 30%; color: #0055a5;">Trường thông tin</th>
            <th align="left" style="color: #0055a5;">Chi tiết</th>
          </tr>
          <tr>
            <td><strong>Họ và tên</strong></td>
            <td>${name || '<i>(Không nhập)</i>'}</td>
          </tr>
          <tr>
            <td><strong>Số điện thoại</strong></td>
            <td><a href="tel:${phone}" style="color: #0077cc; text-decoration: none; font-weight: bold;">${phone}</a></td>
          </tr>
          <tr>
            <td><strong>Nhu cầu tư vấn</strong></td>
            <td>${demand ? demand.replace(/\n/g, '<br />') : '<i>(Không nhập)</i>'}</td>
          </tr>
          <tr>
            <td><strong>Thời gian đăng ký</strong></td>
            <td>${vnTime}</td>
          </tr>
        </table>
        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
          Email này được gửi tự động từ hệ thống quản lý Đà Nẵng Dashboard.
        </p>
      </div>
    `;

    await sendEmail({
      to: recipients,
      subject: `[B2B VR360] Yêu cầu tư vấn mới từ ${phone}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: 'Thông tin tư vấn đã được gửi thành công!' });
  } catch (error) {
    console.error('Error receiving consultation request:', error);
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra trên server' }, { status: 500 });
  }
}
