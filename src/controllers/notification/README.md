
Page có 2 giá trị cần lưu ý liên quan đến gửi thông báo cần lưu ý: 

- userId: id của user sở hữu Page
- relativeUserId: là id của user thuộc Page ( vì Page cũng là 1 user )

Vì Page không có device token, nên khi gửi cloud notification sẽ gửi đến user sỡ hữu Page.

Để đảm bảo thông của page và user là độc lập, và tính năng đã đọc thông báo được độc lập giữa các bên với nhau. Nên thông báo đến Page sẽ có userId là relativeUserId, và bên cạnh đó, gửi thêm 1 thông báo đến user sở hữu Page nên cần gửi thêm 1 thông báo với userId là userId của user sở hữu
