function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTelegramAlert({ 
  projectName, 
  customerName, 
  amName, 
  requestContent, 
}: { 
  projectName: string; 
  customerName: string; 
  amName: string; 
  requestContent: string; 
  projectId?: string | number;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsStr = process.env.TELEGRAM_DIRECTOR_CHAT_ID;
  
  if (!token || !chatIdsStr) {
    console.error("Telegram credentials missing in environment variables.");
    return;
  }

  const chatIds = chatIdsStr.split(",").map(id => id.trim());
  const text = `🚨 <b>THÔNG BÁO KHẨN TỪ TTKDGPS</b> 🚨\n\n` +
               `<b>Dự án:</b> ${escapeHtml(projectName)}\n` +
               `<b>Khách hàng:</b> ${escapeHtml(customerName)}\n` +
               `<b>Chuyên viên:</b> ${escapeHtml(amName)}\n\n` +
               `⚠️ <b>Nội dung cần xử lý gấp:</b>\n` +
               `<i>${escapeHtml(requestContent)}</i>\n\n` +
               `<a href='https://dashboard.gpsdna.io.vn/giam-doc-theo-doi'>👉 BẤM VÀO ĐÂY ĐỂ XỬ LÝ TRÊN HỆ THỐNG</a>`;

  // Send to all IDs in parallel
  const sendPromises = chatIds.map(async (chatId) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: "HTML",
          text: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Telegram API error for chat ID ${chatId}:`, errorData);
        return { chatId, success: false, error: errorData };
      } else {
        console.log(`Telegram alert sent successfully to ${chatId}`);
        return { chatId, success: true };
      }
    } catch (error: any) {
      console.error(`Failed to send Telegram alert to chat ID ${chatId}:`, error);
      return { chatId, success: false, error: error.message };
    }
  });

  await Promise.allSettled(sendPromises);
}
