export function verifyCodeEmail(data: {name?: string; code?: string}): string {
  return `<div style="width:600px">
<hr style="height:1px;background-color:#c0c0c0;color:#c0c0c0">
<div style="padding-top:24px;font-weight:bold;color:#000000;font-size:14px">Dear ${data?.name},</div>
<div style="padding-top:24px;color:#000000;font-size:12px">Thank you for your interest in our product.</div>
<div style="padding-top:20px;padding-bottom:16px;color:#000000;font-size:12px"><b>jGooooo</b> is available for free for non-commercial use. When you are prompted for an activation code, please input the code below.<br></div>
<div style="padding:12px;background-color:#e0e0e0;color:#000000;font-weight:bold;font-size:16px" align="center">${data?.code}</div>
<div style="padding-top:24px;font-size:12px">Enjoy!</div>
<div style="padding-top:24px;font-size:12px">
Sincerely,<br>
jGooooo Support Team
</div></div>`;
}

export function registerSuccessMail(data: {name: string}) {
  return `<div width="100%" bgcolor="#081C24" style="background:#081c24;margin:0">
<center style="width:100%;background:#081c24;text-align:left" bgcolor="#081C24">

    
    <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;font-family:sans-serif">
        Hi ${data.name}, welcome to jGooooo! Thanks for registering an account on Just Gooooo (jGoooooo). We're excited to see you join the community.
    </div>
    

    <div style="max-width:680px;margin:auto">
        

        
        <table style="max-width:680px" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
            <tbody><tr>
                <td style="padding-left:20px;padding-right:20px;text-align:left" width="80">
                    <img style="display:block" src="https://res.cloudinary.com/utotech/image/upload/v1587099708/logo.png" alt="The Movie Database (TMDb)" class="CToWUd" height="62" border="0">
                </td>
                <td style="overflow:hidden;vertical-align:top;padding-right:20px" valign="top" align="right">
                    <img style="display:block;vertical-align:top" src="https://ci6.googleusercontent.com/proxy/Yki_9iy-BXty8DD25aDbT4P-EJ5tRRucOONWLz82X5moOTj-0VruBqUlgetjF5kf7O_uhwSVw2ktji0jMTWv9tT1jq2KuQCg-ZQdDvSJkw1Kw2Gb9rsyeJg6y6j0SmR4sRu1wFH2XHblQXq6DIlrIJdx5OiGmr1xlJqBuwjYpkoZrlBcz_fuJ8wJhitpKed5Sr_h94Wp5dDDECkW8CA=s0-d-e1-ft#https://www.themoviedb.org/assets/1/v4/email/static_cache/pipes-green-3e65f87722d49658b4492284c9ec6411bd9d38f2e302c67ea2f10496d20be4c2.png" class="CToWUd a6T" tabindex="0" width="303" height="124" border="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 1026px; top: 360px;"><div id=":o6" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" title="Tải xuống" role="button" tabindex="0" aria-label="Tải xuống tệp đính kèm " data-tooltip-class="a1V"><div class="aSK J-J5-Ji aYr"></div></div></div>
                </td>
            </tr>
        </tbody></table>
        

        
        <table style="max-width:680px" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">

        
            <tbody><tr>
                <td>
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tbody>
                        <tr>
                            <td style="padding:40px 20px 0 20px;text-align:left;font-family:'Source Sans Pro',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#fff">
                                <h2 style="font-size:20px;font-weight:700;letter-spacing:0.08em;margin:0 0 8px 0;color:#fff">${data.name}, welcome to jGooooo!</h2>
<hr style="text-align:left;margin:0px;width:40px;height:3px;color:#01d277;background-color:#01d277;border-radius:4px;border:none">

<p style="font-size:15px;font-weight:300;color:#fff">Thanks for registering an account on Just Gooooo! (jGooooo). We're excited to see you join the community! As a member of jGooooo, you get access to things like share information about your trips, creating custom lists, rate the places you've been as well as contribute reviews and discussions..</p>

<p style="font-size:15px;font-weight:300;color:#fff">The best thing about jGooooo is our incredible community. All of the data that's been added to our database has been contributed by users like you. If you have any interest in helping we recommend taking a read through our <a style="color:#fff" href="https://www.themoviedb.org/bible" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.themoviedb.org/bible&amp;source=gmail&amp;ust=1587183777623000&amp;usg=AFQjCNFHQHJG8v4mHrGk6M0SzDzLr7i7Tg">contribution bible</a>.</p>

<p style="font-size:15px;font-weight:300;color:#fff">Take some time to look around and if you have any questions, feel free to stop by <a style="color:#fff" href="https://www.themoviedb.org/talk" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.themoviedb.org/talk&amp;source=gmail&amp;ust=1587183777623000&amp;usg=AFQjCNHwfE-ePWcw67DFpR6Kk0djAp7KGw">the forums</a>.</p>

<p style="margin:40px 0;color:#fff"><a style="color:#fff;border-radius:20px;border:10px solid #01d277;background-color:#01d277;padding:0 10px;text-transform:uppercase;text-decoration:none;font-weight:700" href="https://www.themoviedb.org/login?username=hoanganhtuan" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.themoviedb.org/login?username%3Dhoanganhtuan&amp;source=gmail&amp;ust=1587183777623000&amp;usg=AFQjCNFe9ZVJSQgy4vL_LL4rjAkrO0huAg">Let's go!</a></p>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>

        

        </tbody></table>
        

        
        <table style="max-width:680px" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
            <tbody><tr>
                <td style="padding:30px 20px 30px 20px">
                    <hr style="color:#fff;height:1px;border:0;background-color:#fff">
                </td>
            </tr>
            <tr>
                <td style="color:#fff;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:13px;font-weight:normal;padding:0 20px" valign="top" align="left">
                    <table style="border-collapse:collapse" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tbody>
                        <tr>
                            <td style="padding:0 0 20px 0" width="52" align="left">
                                <a href="https://www.facebook.com/utotechjsc" style="color:#fff;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:13px;font-weight:normal;line-height:100%;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/themoviedb&amp;source=gmail&amp;ust=1587183777623000&amp;usg=AFQjCNHnYL7GZFOl4NZZz32Iv2jmY2xqXA">
                                    <img style="display:block" src="https://ci5.googleusercontent.com/proxy/omC3f_ohglhb42Rl7zbuKmj1CWfwKzm-rUTTVNIpqiKcRkdM1l21bNS9k8XwPj3L6BRIgsQSAgnY7yRfTapECP9Q62AXNl3XRp7XcGQxOHtroP1bw6-hJbKlV0Gn6CIA6QGjV-vkVcfn6ZaJiuH4F2tT75XcMelhemMbsQo7E69MkHj631GOASpCnsO1f4Ubl960davUn9xjLuCm9PKBwIPctB9d-A=s0-d-e1-ft#https://www.themoviedb.org/assets/1/v4/icons/social/static_cache/png/facebook-d67dceb392a9583a8ae5da8c2bf832944432cdd2d93f4895a77ee269c8c37cf8.png" class="CToWUd" width="32" height="32">
                                </a>
                            </td>
<!--                            <td style="padding:0 0 20px 0" align="left">-->
<!--                                <a href="https://twitter.com/themoviedb" style="color:#fff;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:13px;font-weight:normal;line-height:100%;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://twitter.com/themoviedb&amp;source=gmail&amp;ust=1587183777623000&amp;usg=AFQjCNHvCW5BYl8U5m37AEPa8Fx9EEGKVw">-->
<!--                                    <img style="display:block" src="https://ci6.googleusercontent.com/proxy/iOYOM43TpH2q5xUEopF0Tiz4GQC957woZZcchDDty5Q47gSTCPHOVNg9lnRPO8u6W0FqXZ5bIrxoie8aiWp-DbyVWWbtGTRi8NAliGgsXBL4g4BA7PWpLijFwTBlcZKmZojvRIL_5_oWY7A9VP0QwPNDMf8moFweLuknaUvrp16fIidX5iLVyfmf8_dWZ2uRKPn6CIZMJTCVYu6DJ8fcUXjIFgNu=s0-d-e1-ft#https://www.themoviedb.org/assets/1/v4/icons/social/static_cache/png/twitter-c8a6f7cd6682d517c08ab185707ecdad5135baa44e042fe35f5a99b61a406036.png" class="CToWUd" width="32" height="32">-->
<!--                                </a>-->
<!--                            </td>-->
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:0 20px 40px 20px;width:100%;font-size:13px;font-family:sans-serif;text-align:left;color:#fff">
                    <p style="margin:0;padding:0;font-size:13px">You are receiving this email because you are a registered user on <a style="font-size:13px" href="https://utotechzone.com" target="_blank" >www.utotechzone.com</a>.</p>
                </td>
            </tr>
        </tbody></table>
        

        
    </div>
</center><div class="yj6qo"></div><div class="adL">
</div></div>`;
}
