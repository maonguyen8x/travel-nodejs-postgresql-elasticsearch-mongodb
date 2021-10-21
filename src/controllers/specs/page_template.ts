export function confirmmingPage(data: {name: string}): string {
  // Subject: Your page is under verification. | Trang của bạn đang chờ được xác nhận.
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Xin chào ${data?.name}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Khi bạn tạo 1 Trang trên nền tảng của chúng tôi, có nghĩa là bạn quyết định trở thành Đối tác kinh doanh của chúng tôi.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Cảm ơn bạn đã chọn jGooooo!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Trang của bạn đang chờ để được xác nhận bởi Đội ngũ hỗ trợ của chúng tôi.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Bình thường, xác nhận này sẽ được chúng tôi kiểm duyệt trong vòng 1 tới 24 giờ tới, kể từ lúc nhận được yêu cầu tạo trang. Nếu bạn không nhận được bất kỳ Email xác nhận nào trong vòng 24 giờ tới, xin vui lòng cho chúng tôi biết bằng cách phản hồi email này.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thân!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">Dear ${data?.name}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">When you create a Page on our Platform, you decide to become our Businesspartner.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Thank you for choosing jGooooo!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Your Page are in line to be verified by jGooooo Support Team.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Normally, the confirmation will be done in 1 – 24 hours.If there is no confirmation email sent to you within 24 hours, please let us know by reply this email.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best regards,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function rejectionPage(): string {
  // Subject: We are sorry! Your Page has not been approved. | Rất tiếc! Trang của bạn không đạt tiêu chuẩn.
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi rất tiếc vì điều này.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Đã có 1 vài vấn đề phát sinh trong quá trình kiểm duyệt thông tin Trang của bạn.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Bạn cần đáp ứng các yêu cầu dưới đây:</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">1.</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">2.</div>
  <div style="color:#000000;font-size:14px">...</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">Nếu vì bất cứ lý do gì mà bạn không thể hoàn thành quá trình xác minh này, có nghĩa rằng Trang của bạn sẽ không được tạo.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Xin gửi những lời chúc tốt đẹp nhất!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">Unfortunately, we are having problems on verifying your Page information.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">You need to complete those things below:</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">1.</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">2.</div>
  <div style="color:#000000;font-size:14px">...</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">If you have any reason that cannot finish this process, your Page will be rejected.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thank you for understanding!<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function confirmPageSuccess(data: {myProfileLink: string}): string {
  // Subject: Congratulation! You have successfully created your Page. | Xin chúc mừng bạn! Trang của bạn đã được xác minh.
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi vui mừng thông báo với bạn rằng bạn đã chính thức trở thành Đối tác kinh doanh của chúng tôi trên nền tảng jGooooo.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Trang của bạn đã được tạo thành công.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Nhấn vào link để xem Trang của bạn: ${data?.myProfileLink}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi mong rẳng đây sẽ là một cuộc hợp tác tuyệt vời.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Xin gửi những lời chúc tốt đẹp nhất!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">We are happy to announce that you have become our official Business partner on jGooooo.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Your Page has been approved.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">See your Page on jGooooo Platform through this link:  ${data?.myProfileLink}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">We hope this will be a great co-operation!</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best wishes,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}
