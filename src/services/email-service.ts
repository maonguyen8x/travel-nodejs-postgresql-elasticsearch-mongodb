import nodemailer, {SentMessageInfo} from 'nodemailer';
import paramsDEV from './specs/dev-email-service-config.json';
import paramsPROD from './specs/prod-email-service-config.json';
import Mail = require('nodemailer/lib/mailer');

const params = {
  development: paramsDEV,
  production: paramsPROD,
};
export class EmailService {
  public transporter: Mail;
  constructor() {
    this.transporter = nodemailer.createTransport({
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      ...params[String(process.env.PROJECT_EVN_TYPE || 'development')],
      pool: true,
    });
  }
  async sendMail(mailOptions: Mail.Options): Promise<SentMessageInfo> {
    // eslint-disable-next-line no-return-await
    return this.transporter.sendMail(mailOptions);
  }
}
