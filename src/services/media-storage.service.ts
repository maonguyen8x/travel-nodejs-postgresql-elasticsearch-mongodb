import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {AnyObject} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {isString} from 'lodash';
import {MEDIA_SERVER_INFO} from '../configs/utils-constant';
import request from 'request';
import {handleError} from '../utils/handleError';
import {ErrorCode} from '../constants/error.constant';
const fs = require('fs');
/*
 * Fix the service type. Possible options can be:
 * - import {CloudinaryStorage} from 'your-module';
 * - export type CloudinaryStorage = string;
 * - export interface CloudinaryStorage {}
 */
export type MediaStorage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload(file: any, container: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(publicId: string): Promise<any>;
};

@bind({scope: BindingScope.TRANSIENT})
export class MediaStorageProvider implements MediaStorage {
  constructor(/* Add @inject to inject parameters */) {}

  upload(file: AnyObject | string, folder?: string): Promise<AnyObject> {
    return new Promise((resolve, reject) => {
      if (isString(file)) {
        request.post(
          MEDIA_SERVER_INFO.media_uri,
          {
            formData: {
              file: {
                value: fs.createReadStream(file),
                options: {
                  contentType: 'image/jpeg',
                },
              },
            },
            json: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error: any, result: any) => {
            if (result?.statusCode !== 200) {
              reject(new HttpErrors.BadRequest(result?.statusCode));
            }
            if (error) {
              return reject(error);
            }
            return resolve(result.body);
          },
        );
      } else {
        const resourceType = this.getResourceType(file.mimetype);
        if (!resourceType) {
          throw new HttpErrors.BadRequest(ErrorCode.INVALID_MINETYPE);
        }
        request.post(
          MEDIA_SERVER_INFO.media_uri,
          {
            formData: {
              file: {
                value: fs.createReadStream(`${file.path}`),
                options: {
                  contentType: file.mimetype,
                },
              },
            },
            json: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error: any, result: any) => {
            if (result?.statusCode !== 200) {
              reject(new HttpErrors.BadRequest(result?.statusCode));
            }
            if (error) {
              return reject(error);
            }
            return resolve(result.body);
          },
        );
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete(publicId: string): Promise<any> {
    try {
      return request.delete(`${MEDIA_SERVER_INFO.media_uri}${MEDIA_SERVER_INFO.prefix_delete}/${publicId}`);
    } catch (e) {
      return handleError(e);
    }
  }

  getResourceType(mimetype: string): string {
    return mimetype.split('/')[0] || '';
  }
}
