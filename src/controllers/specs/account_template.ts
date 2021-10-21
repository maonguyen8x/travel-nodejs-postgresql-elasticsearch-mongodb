export function verifyCodeEmail(data: {name?: string; code?: string}): string {
  // Subject:  Email verification from jGooooo | Xác nhận Email để hoàn thành đăng ký tài khoản jGooooo của bạn.
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">Xin chào ${data?.name},</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi rất vui mừng khi bạn cảm thấy thích thú và sử dụng ứng dụng jGooooo của chúng tôi.</div>
  <div style="padding-top:20px;padding-bottom:20px;color:#000000;font-size:14px">Để hoàn thành việc đăng ký này, bạn hãy nhập mã code sau đây vào phần Xác thực trong Ứng dụng:</div>
  <div style="padding:12px;background-color:#e0e0e0;color:#000000;font-weight:bold;font-size:16px" align="center">${data?.code}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Mã code này sẽ có hiệu lực trong 24 giờ tới và chỉ được sử dụng 1 lần duy nhất.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Xin cảm ơn,<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">Hi ${data?.name},</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">This message has been sent to you because you enter this email while registering the account on jGooooo. If It was not you, please ignore this email.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">We are glad that you find our product interestingly and get started with jGooooo.</div>
  <div style="padding-top:20px;padding-bottom:20px;color:#000000;font-size:14px">Please enter this code to complete your registration.</div>
  <div style="padding:12px;background-color:#e0e0e0;color:#000000;font-weight:bold;font-size:16px" align="center">${data?.code}</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">The code is valid for 24 hours and can be used only once.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thanks,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function registerSuccessMail(data: {name?: string; myProfileLink?: string}) {
  // Subject: Congratulation from jGooooo! | Chào mừng bạn đến cộng đồng jGooooo chúng tôi.
  return `<div style="width:600px">
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
<div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">Xin chúc mừng bạn!</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Chào mừng bạn đến với cộng đồng jGooooo!</div>
<div style="padding-top:20px;color:#000000;font-size:14px">jGooooo là một nền tảng Ứng dụng Mạng xã hội cho những người yêu thích đi du lịch trên toàn thế giới. Chúng tôi cung cấp những giải pháp giúp cho việc đi du lịch của bạn trở nên đơn giản hơn, dễ dàng hơn, tiết kiệm hơn.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi mong rằng bạn sẽ có những trải nghiệm tuyệt vời nhất với jGooooo.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Đây là đường link dẫn tới Trang cá nhân trên jGooooo của bạn: ${
    data?.myProfileLink || `https://utotechzone.com/${data?.name}`
  }.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">JUST GOOOOO WITH US.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">PS: Chúng tôi đang phấn đấu xây dựng một ứng dụng tuyệt vời cho cộng đồng những người yêu du lịch, vì vậy nếu bạn có những đóng góp hay có 
  những khó khăn gì trong quá trình đăng nhập jGooooo, xin vui lòng phản hồi với chúng tôi thông qua email này.
</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Chúng tôi xin cảm ơn!<br>
  Đội ngũ hỗ trợ từ jGooooo
</div>
<hr style="border-top: 1px dashed black;">
<div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">Well done!</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Well come to jGooooo community!</div>
<div style="padding-top:20px;color:#000000;font-size:14px">jGooooo is a social networking application, platform for travel lovers all around the world. We provide solutions to make travel simpler, easier, more affordable.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">We are hopeful that you have a great experience with us.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Here’s your personal jGooooo web-link: ${
    data?.myProfileLink || `https://utotechzone.com/${data?.name}`
  }.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Think about Travel, think about jGooooo.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">JUST GOOOOO WITH US.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">PS: We also love hearing from you and helping you with any struggles you have. Please feel free to let us know by replying this email (through this comment box).</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Our best,<br>
  jGooooo Support Team
</div>
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function PasswordResetting(data: {name: string; resetPasswordLink: string}) {
  // Subject: Your request to change password on your jGooooo account. | Yêu cầu thay đổi mật khẩu từ tài khoản jGooooo của bạn.
  return `<div style="width:600px">
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
<div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">Chào ${data?.name},</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi vừa nhận được yêu cầu Thay đổi mật khẩu từ tài khoản jGooooo của bạn. Vui lòng nhấn vào link bên dưới (nhấn vào nút bên dưới) để tạo lập mật khẩu mới.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">${data?.resetPasswordLink}</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Việc thay đổi mật khẩu này có hiệu lực trong vòng 30 phút từ thời điểm bạn nhận được email này.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Nếu bạn chưa từng yêu cầu thay đổi mật khẩu, xin hãy bỏ qua email này hoặc phản hồi với chúng tôi thông qua email này.</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Chúng tôi xin cảm ơn!<br>
  Đội ngũ hỗ trợ từ jGooooo
</div>
<hr style="border-top: 1px dashed black;">
<div style="padding-top:20px;font-weight:bold;color:#000000;font-size:14px">HI ${data?.name},</div>
<div style="padding-top:20px;color:#000000;font-size:14px">You recently requested to reset your password for your jGooooo account. Use the link (Click the button) below to set up a new password.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">${data?.resetPasswordLink}</div>
<div style="padding-top:20px;color:#000000;font-size:14px">This password reset is only valid for the next 30 minutes.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">If you did not request a password reset, please ignore this email or reply to let us know.</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Thanks,<br>
  jGooooo Support Team
</div>
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function PasswordResetSuccess() {
  // Subject: YOUR PASSWORD HAS BEEN CHANGED! | Mật khẩu của bạn đã được thay đổi!
  return `<div style="width:600px">
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
<div style="padding-top:20px;color:#000000;font-size:14px">Email này được gửi tới để xác nhận việc bạn đã thay đổi mật khẩu thành công.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">Nếu bạn có bất kỳ câu hỏi hay khó khăn trong việc đăng nhập lại, xin vui lòng phản hồi với chúng tôi thông qua email này.</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Chúng tôi xin cảm ơn!<br>
  Đội ngũ hỗ trợ từ jGooooo
</div>
<hr style="border-top: 1px dashed black;">
<div style="padding-top:20px;color:#000000;font-size:14px">This email confirms that your password has been successfullyreset according to your request.</div>
<div style="padding-top:20px;color:#000000;font-size:14px">If you have any questions or struggles while logging on, please contact us byreplying this email.</div>
<div style="padding-top:20px;padding-bottom:20px;font-size:14px">
  Thanks,<br>
  jGooooo Support Team
</div>
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}
