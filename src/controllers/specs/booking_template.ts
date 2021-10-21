export function createNewBookingForPartner(): string {
  // Subject: New booking from jGooooo (mm/dd/ -dd, yyyy) | Thông báo đặt phòng/ tour từ tài khoản jGooooo của bạn (mm/dd/ -dd, yyyy)
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Mã số đặt phòng/ tour: xxxxxx</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Bạn có yêu cầu đặt phòng mới từ Người dùng có ID: ....</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Tên:</div>
  <div style="color:#000000;font-size:14px">Email:</div>
  <div style="color:#000000;font-size:14px">Số điện thoại:</div>
  <table style="width:100%; margin-top:20px; border: 1px solid black;border-collapse: collapse;">
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <th style="border: 1px solid black; border-collapse: collapse;">Thông tin đặt phòng</th>
      <th style="border: 1px solid black; border-collapse: collapse;">Thông tin đặt tour</th>
    </tr>
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <td style="border: 1px solid black; border-collapse: collapse;">
        Ngày đi (Date, dd/mm)<br/>
        Ngày về (Date, dd/mm)<br/>
        Khoảng thời gian ở<br/>
        Số lượng khách<br/>
        Chi tiết loại phòng<br/>
        Tổng chi phí<br/>
      </td>
      <td style="border: 1px solid black; border-collapse: collapse;">
        Mã số tour (Tour ID)<br/>
        Tên tour<br/>
        Số lượng khách<br/>
        Tổng chi phí<br/>
      </td>
    </tr>
  </table>
  <div style="padding-top:20px;color:#000000;font-size:14px">Xin vui lòng xác nhận yêu cầu đặt phòng/ tour</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Chấp nhận/ Từ chối</div>
  <div style="color:#000000;font-size:14px">(Nếu chọn từ chối, bắt buộc ghi lý do)</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Cảm ơn!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">Booking ID: xxxxxxxx</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">You have a new booking from User: ID .....</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Name:</div>
  <div style="color:#000000;font-size:14px">Email:</div>
  <div style="color:#000000;font-size:14px">Phone number:</div>
  <table style="width:100%; margin-top:20px; border: 1px solid black;border-collapse: collapse;">
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <th style="border: 1px solid black; border-collapse: collapse;">Hotel details</th>
      <th style="border: 1px solid black; border-collapse: collapse;">Tour details</th>
    </tr>
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <td style="border: 1px solid black; border-collapse: collapse;">
        Check in (Date, dd/mm)<br/>
        Check out (Date, dd/mm)<br/>
        Duration of stay<br/>
        Number of guests<br/>
        Room details<br/>
        Total fee<br/>
      </td>
      <td style="border: 1px solid black; border-collapse: collapse;">
        Tour number (Tour ID)<br/>
        Tour name<br/>
        Number of guests<br/>
        Total fee<br/>
      </td>
    </tr>
  </table>
  <div style="padding-top:20px;color:#000000;font-size:14px">Please confirm this booking request by click the button below.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Accept/ Reject</div>
  <div style="color:#000000;font-size:14px">(if choose Reject, ask Partner to present the reason)</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best wishes	,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function createNewBookingForUser(): string {
  // Subject: Reservation notification from jGooooo (mm/dd/ -dd, yyyy) | Thông báo đặt phòng/ tour từ tài khoản jGooooo của bạn (mm/dd/ -dd, yyyy)
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Cảm ơn bạn đã đặt phòng/tour, User name!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Mã số đặt phòng/ tour: xxxxxx</div>
  <table style="width:100%; margin-top:20px; border: 1px solid black;border-collapse: collapse;">
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <th style="border: 1px solid black; border-collapse: collapse;">Thông tin đặt phòng</th>
      <th style="border: 1px solid black; border-collapse: collapse;">Thông tin đặt tour</th>
    </tr>
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <td style="border: 1px solid black; border-collapse: collapse;">
        Ngày đi (Date, dd/mm)<br/>
        Ngày về (Date, dd/mm)<br/>
        Khoảng thời gian ở<br/>
        Số lượng khách<br/>
        Chi tiết loại phòng<br/>
        Tổng chi phí<br/>
      </td>
      <td style="border: 1px solid black; border-collapse: collapse;">
        Mã số tour (Tour ID)<br/>
        Tên tour<br/>
        Số lượng khách<br/>
        Tổng chi phí<br/>
      </td>
    </tr>
  </table>
  <div style="padding-top:20px;color:#000000;font-size:14px">Xin vui lòng chờ xác nhận đặt phòng/ tour từ (Tên đối tác)!</div>
  <div style="color:#000000;font-size:14px">Nếu bạn tìm thấy bất cứ lỗi nào, xin vui lòng liên trực tiếp với (Tên đối tác).</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thân!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">Cảm ơn bạn đã đặt phòng/tour, User name!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Mã số đặt phòng/ tour: xxxxxx</div>
  <table style="width:100%; margin-top:20px; border: 1px solid black;border-collapse: collapse;">
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <th style="border: 1px solid black; border-collapse: collapse;">Hotel details</th>
      <th style="border: 1px solid black; border-collapse: collapse;">Tour details</th>
    </tr>
    <tr style="border: 1px solid black; border-collapse: collapse;">
      <td style="border: 1px solid black; border-collapse: collapse;">
        Check in (Date, dd/mm)<br/>
        Check out (Date, dd/mm)<br/>
        Duration of stay<br/>
        Number of guests<br/>
        Room details<br/>
        Total fee<br/>
      </td>
      <td style="border: 1px solid black; border-collapse: collapse;">
        Tour number (Tour ID)<br/>
        Tour name<br/>
        Number of guests<br/>
        Total fee<br/>
      </td>
    </tr>
  </table>
  <div style="padding-top:20px;color:#000000;font-size:14px">Please waiting for (Partner name) to confirm your booking!</div>
  <div style="color:#000000;font-size:14px">If you find any mistakes, please contact directly to (Partner name).</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best regards,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function confirmApprovalBooking(data: {username: string; partnerName: string}): string {
  // Subject: Your booking has been confirmed | Đặt phòng/ tour thành công!
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Bạn đã đặt phòng/ tour thành công.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Cảm ơn ${data?.username} đã tin tưởng jGooooo và ${data?.partnerName} cho kỳ nghỉ của mình.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Mong bạn sẽ có những trải nghiệm tuyệt vời.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thân!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">YOUR BOOKING HAS BEEN CONFIRMED.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Thank you ${data?.username} for choosing jGooooo and ${data?.partnerName}!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">We hope you will have the greatest experiences.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best wishes	,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function confirmDisapprovalBooking(data: {bookingId: string; partnerName: string}): string {
  // Subject: Opp! Your booking has been rejected | Yêu cầu đặt phòng/ tour của bạn đã bị từ chối
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi rất lấy làm tiếc vì yêu cầu đặt phòng của bạn đã bị từ chối vì lý do:</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">1.</div>
  <div style="padding-top:5px;color:#000000;font-size:14px">2.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi hy vọng sẽ không có những vấn đề tương tự xảy ra trong những lần đặt phòng/tour tiếp theo.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thân!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">WE ARE SORRY!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Your booking ${data?.bookingId} in ${data?.partnerName} has been rejected because .....</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">We hope that there will be no problem for your next booking.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best regards,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}

export function informEndOfStayOrTour(): string {
  // Subject: Your stay/ tour in/at (Partner) has been finished! | Thời gian đặt phòng của bạn ở (Đối tác) đã kết thúc/ Tour của bạn với (Đối tác) đã kết thúc.
  return `<div style="width:600px">
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
  <div style="padding-top:20px;color:#000000;font-size:14px">Cảm ơn bạn đã chọn jGooooo đồng hành với bạn trong kỳ du lịch này.</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">Chúng tôi hy vọng bạn đã có những trải nghiệm tuyệt vời.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Thân mến!<br>
    Đội ngũ hỗ trợ từ jGooooo
  </div>
  <hr style="border-top: 1px dashed black;">
  <div style="padding-top:20px;color:#000000;font-size:14px">Thank you for choose jGooooo as your Online Travel Agency!</div>
  <div style="padding-top:20px;color:#000000;font-size:14px">We hope that you had a great time with us.</div>
  <div style="padding-top:20px;padding-bottom:20px;font-size:14px">
    Best regards,<br>
    jGooooo Support Team
  </div>
  <hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
</div>`;
}
