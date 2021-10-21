// Uncomment these imports to begin using these cool features!
import {MEIDA_STORE_PATH} from '../../configs/utils-constant';
import {AnyObject, repository} from '@loopback/repository';
import {MediaContentsRepository} from '../../repositories';
import {inject} from '@loopback/context';
import {MediaStorageProviderBindings} from '../../keys';
import {MediaStorageProvider} from '../../services';
import {Request} from '@loopback/rest';
import {MediaContents} from '../../models';
import {isString} from 'lodash';
import * as fs from 'fs';
import {MediaContentsOptionInterface} from './media-contents.interface';
import moment from 'moment';

export class MediaContentsHandlerController {
  constructor(
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @inject(MediaStorageProviderBindings.MEDIA_SERVICE)
    public mediaStorage: MediaStorageProvider,
  ) {}

  async uploadMedia({
    file,
    folder,
    userId,
    option,
  }: {
    file: AnyObject | string;
    folder?: string;
    userId?: number;
    option?: MediaContentsOptionInterface;
  }): Promise<MediaContents> {
    const data = await this.mediaStorage.upload(file, folder);
    if (!isString(file)) {
      fs.unlink(file.path, () => {});
    } else {
      fs.unlink(file, () => {});
    }
    return this.mediaContentsRepository.create({
      ...option,
      url: data.secure_url,
      publicId: data.public_id,
      userId: userId,
      format: data.format,
      fileName: data.public_id + '.' + data.format,
      path: MEIDA_STORE_PATH,
      urlBlur: data.blur_url,
      urlTiny: data.tiny_url,
      urlOptimize: data.optimize_url,
      urlBackground: data.background_url,
      resourceType: data?.resource_type?.toUpperCase(),
      metadata: JSON.stringify(data),
      createdAt: moment().utc().toISOString(),
      updatedAt: moment().utc().toISOString(),
    });
  }

  getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => {
      return {
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        filename: f.filename,
        path: f.path,
        size: f.size,
        destination: f.destination,
      };
    };
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const fileName in uploadedFiles) {
        files.push(...uploadedFiles[fileName].map(mapper));
      }
    }
    return {files, fields: request.body};
  }
}
