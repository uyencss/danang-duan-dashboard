import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, demand } = body;

    // Log the consultation request to the server console/logs
    console.log('\n====================================');
    console.log('📢 YÊU CẦU TƯ VẤN B2B MỚI (VR360)');
    console.log(`- Họ tên: ${name || '(Không nhập)'}`);
    console.log(`- Số điện thoại: ${phone}`);
    console.log(`- Nhu cầu: ${demand || '(Không nhập)'}`);
    console.log(`- Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    console.log('====================================\n');

    return NextResponse.json({ success: true, message: 'Thông tin tư vấn đã được gửi thành công!' });
  } catch (error) {
    console.error('Error receiving consultation request:', error);
    return NextResponse.json({ success: false, error: 'Có lỗi xảy ra trên server' }, { status: 500 });
  }
}
