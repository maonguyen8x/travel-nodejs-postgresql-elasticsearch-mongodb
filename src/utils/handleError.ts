import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import logger from './logger';
export const handleError = (err: HttpErrors.HttpError) => {
  logger.error(err.stack);
  throw err;
};

export const removeCredential = (obj: any) => {
  delete obj.email;
  delete obj.password;
  return obj;
};

export const pushError = (errStr: String) => {
  const message = {
    attachments: [
      {
        color: '#cc1104',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '```' + errStr + '```',
            },
          },
        ],
      },
    ],
  };

  const url = process.env.SLACK_ERROR_HOOK_URL ?? '';
  if (url) {
    axios.post(url, message);
  }
};
