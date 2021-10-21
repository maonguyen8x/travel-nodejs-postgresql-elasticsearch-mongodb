import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {Filter, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {MediaStorageProviderBindings} from '../../keys';
import {MediaContents} from '../../models';
import {BackgroundPostRepository, MediaContentsRepository} from '../../repositories';
import {MediaStorageProvider} from '../../services';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {MediaContentsHandlerController} from './media-contents-handler.controller';
import {
  MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_FOOD,
  MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_STAY,
  MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_TOUR,
  MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_FOOD,
  MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_STAY,
  MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_TOUR,
  MEDIA_CONTENT_TYPE_SYSTEM,
  MEDIA_CONTENT_TYPE_SYSTEM_BACKGROUND_POST,
  SystemDefaultAvatarMediaTypeEnum,
} from '../../configs/media-contents-constants';
import {handleError} from '../../utils/handleError';
import {
  IMAGE_FOLDER_PATH,
  IMAGE_BACKGROUND_POST_FOLDER_PATH,
  MEDIA_SERVER_INFO,
  MEIDA_STORE_PATH,
} from '../../configs/utils-constant';
import multer = require('multer');
import {readdirSync} from 'fs';
import {ErrorCode} from '../../constants/error.constant';
import * as root from 'app-root-path';
import moment from 'moment';
import {getRandomInt} from '../../utils/common';

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

export class MediaContentsController {
  constructor(
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @inject(MediaStorageProviderBindings.MEDIA_SERVICE)
    public mediaStorageProvider: MediaStorageProvider,
    @inject('controllers.MediaContentsHandlerController')
    public mediaContentsHandler: MediaContentsHandlerController,
    @repository(BackgroundPostRepository)
    public backgroundPostRepository: BackgroundPostRepository,
    @inject(RestBindings.Http.REQUEST) public request: Request,
    @inject(RestBindings.Http.RESPONSE) public response: Response,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/media-contents/upload', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Upload a Files model instances into Container',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  })
  async uploadImage(
    @requestBody({
      description: 'multipart/form-data',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<MediaContents[]> {
    try {
      const userId = parseInt(userProfile[securityId]);
      const upload = multer({
        storage,
        limits: {
          fileSize: MEDIA_SERVER_INFO.LIMIT_FILE_SIZE,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await new Promise<{files: {buffer: any}[]}>(async (resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/no-explicit-any
        await upload.any()(request, response, async (err: any) => {
          if (err) reject(err);
          else {
            const data = this.mediaContentsHandler.getFilesAndFields(request);
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return resolve({...data});
          }
        });
      });
      const data: MediaContents[] = [];
      for (const file of res.files) {
        const dataUpload = await this.mediaContentsHandler.uploadMedia({
          file: file,
          userId,
        });
        data.push(dataUpload);
      }
      return await Promise.resolve(data);
    } catch (e) {
      if (e.code === 'LIMIT_FILE_SIZE') {
        return handleError(new HttpErrors.PayloadTooLarge(ErrorCode.FILE_TOO_LARGE));
      }
      return handleError(e);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/messages/{conversationId}/media-contents/upload', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Upload a Files model instances into Container',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  })
  async messengerUpload(
    @requestBody({
      description: 'multipart/form-data',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.string('conversationId') conversationId: string,
  ): Promise<MediaContents[]> {
    try {
      const userId = parseInt(userProfile[securityId]);
      const upload = multer({storage});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await new Promise<{files: {buffer: any}[]}>(async (resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/no-explicit-any
        await upload.any()(request, response, async (err: any) => {
          if (err) reject(err);
          else {
            const data = this.mediaContentsHandler.getFilesAndFields(request);
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return resolve({...data});
          }
        });
      });
      const data: MediaContents[] = [];
      for (const file of res.files) {
        const dataUpload = await this.mediaContentsHandler.uploadMedia({
          file: file,
          folder: `messenger/${conversationId}`,
          userId,
        });
        data.push(dataUpload);
      }
      return await Promise.resolve(data);
    } catch (e) {
      return handleError(e);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/media-contents/upload/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'media_content DELETE success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<{message: string}> {
    try {
      const mediaFile = await this.mediaContentsRepository.findById(id);
      await this.mediaStorageProvider.delete(mediaFile.publicId);
      await this.mediaContentsRepository.deleteById(id);
      return {
        message: 'Delete media_content success',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/media-contents', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of MediaContents model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  })
  async getMediaContents(
    @param.filter(MediaContents, {name: 'filterMediaContents'})
    filter?: Filter<MediaContents>,
  ): Promise<MediaContents[]> {
    return this.mediaContentsRepository.find(filter);
  }

  @get('/get_media_contents', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of MediaContents model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  })
  async getListMediaContents(
    @param.filter(MediaContents, {name: 'filterMediaContents'})
    filter?: Filter<MediaContents>,
  ): Promise<MediaContents[]> {
    return this.mediaContentsRepository.find(filter);
  }

  @post('/avatar_cover_default/upload', {
    responses: {
      '200': {
        description: 'Upload avatar/cover default when reset/init system',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async uploadAvatarCoverDefault(): Promise<{message: string}> {
    try {
      const avatar_default = `${root}${IMAGE_FOLDER_PATH}/avatar_default.png`;
      const cover_default = `${root}${IMAGE_FOLDER_PATH}/cover_default.png`;
      const page_stay_default = `${root}${IMAGE_FOLDER_PATH}/page_stay_default.png`;
      const page_tour_default = `${root}${IMAGE_FOLDER_PATH}/page_tour_default.png`;
      const page_food_default = `${root}${IMAGE_FOLDER_PATH}/page_food_default.png`;

      const [avatar, cover, page_stay, page_tour, page_food] = await Promise.all([
        this.mediaStorageProvider.upload(avatar_default),
        this.mediaStorageProvider.upload(cover_default),
        this.mediaStorageProvider.upload(page_stay_default),
        this.mediaStorageProvider.upload(page_tour_default),
        this.mediaStorageProvider.upload(page_food_default),
      ]);

      await Promise.all([
        this.mediaContentsRepository.updateAll(
          {
            url: avatar.secure_url,
            publicId: avatar.public_id,
            format: avatar.format,
            fileName: avatar.public_id + '.' + avatar.format,
            path: MEIDA_STORE_PATH,
            urlBlur: avatar.blur_url,
            urlTiny: avatar.tiny_url,
            urlOptimize: avatar.optimize_url,
            urlBackground: avatar.background_url,
            resourceType: avatar?.resource_type?.toUpperCase(),
            metadata: JSON.stringify(avatar),
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          {
            mediaType: {
              inq: [
                MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_STAY,
                MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_TOUR,
                MEDIA_CONTENT_TYPE_AVATAR_DEFAULT_PAGE_FOOD,
                SystemDefaultAvatarMediaTypeEnum.male,
                SystemDefaultAvatarMediaTypeEnum.female,
                SystemDefaultAvatarMediaTypeEnum.unspecified,
              ],
            },
          },
        ),
        this.mediaContentsRepository.updateAll(
          {
            url: cover.secure_url,
            publicId: cover.public_id,
            format: cover.format,
            fileName: cover.public_id + '.' + cover.format,
            path: MEIDA_STORE_PATH,
            urlBlur: cover.blur_url,
            urlTiny: cover.tiny_url,
            urlOptimize: cover.optimize_url,
            urlBackground: cover.background_url,
            resourceType: cover?.resource_type?.toUpperCase(),
            metadata: JSON.stringify(cover),
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          {
            mediaType: MEDIA_CONTENT_TYPE_SYSTEM,
          },
        ),
        this.mediaContentsRepository.updateAll(
          {
            url: page_stay.secure_url,
            publicId: page_stay.public_id,
            format: page_stay.format,
            fileName: page_stay.public_id + '.' + page_stay.format,
            path: MEIDA_STORE_PATH,
            urlBlur: page_stay.blur_url,
            urlTiny: page_stay.tiny_url,
            urlOptimize: page_stay.optimize_url,
            urlBackground: page_stay.background_url,
            resourceType: page_stay?.resource_type?.toUpperCase(),
            metadata: JSON.stringify(page_stay),
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          {
            mediaType: MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_STAY,
          },
        ),
        this.mediaContentsRepository.updateAll(
          {
            url: page_tour.secure_url,
            publicId: page_tour.public_id,
            format: page_tour.format,
            fileName: page_tour.public_id + '.' + page_tour.format,
            path: MEIDA_STORE_PATH,
            urlBlur: page_tour.blur_url,
            urlTiny: page_tour.tiny_url,
            urlOptimize: page_tour.optimize_url,
            urlBackground: page_tour.background_url,
            resourceType: page_tour?.resource_type?.toUpperCase(),
            metadata: JSON.stringify(page_tour),
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          {
            mediaType: MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_TOUR,
          },
        ),
        this.mediaContentsRepository.updateAll(
          {
            url: page_food.secure_url,
            publicId: page_food.public_id,
            format: page_food.format,
            fileName: page_food.public_id + '.' + page_food.format,
            path: MEIDA_STORE_PATH,
            urlBlur: page_food.blur_url,
            urlTiny: page_food.tiny_url,
            urlOptimize: page_food.optimize_url,
            urlBackground: page_food.background_url,
            resourceType: page_food?.resource_type?.toUpperCase(),
            metadata: JSON.stringify(page_food),
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          {
            mediaType: MEDIA_CONTENT_TYPE_BG_DEFAULT_PAGE_FOOD,
          },
        ),
      ]);
      return {message: 'Update avatar + cover default successful.'};
    } catch (error) {
      return handleError(error);
    }
  }

  @post('/background_post_default/upload', {
    responses: {
      '200': {
        description: 'Upload background post default when reset/init system',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async uploadBackgroundPostDefault(): Promise<{message: string}> {
    try {
      // Read all image in background post
      const backgroundPostFolder = `${root}${IMAGE_FOLDER_PATH}${IMAGE_BACKGROUND_POST_FOLDER_PATH}`;
      const backgroundPostFiles = readdirSync(backgroundPostFolder);
      const colors = ['#FFF', '#000', '#FF7878', '#FFAD31', '#28AEF2', '#32C08D', '#945E0E'];
      for (let i = 0; i < backgroundPostFiles.length; i++) {
        const file = backgroundPostFiles[i];
        const filePath = `${backgroundPostFolder}/${file}`;
        const bpUploaded = await this.mediaStorageProvider.upload(filePath);
        await this.backgroundPostRepository.create({
          color: colors[getRandomInt(0, colors.length - 1)],
          backgroundPost: {
            url: bpUploaded.url,
            urlBlur: bpUploaded.urlBlur,
            urlTiny: bpUploaded.urlTiny,
            urlBackground: bpUploaded.urlBackground,
            urlOptimize: bpUploaded.urlOptimize,
            metadata: bpUploaded.metadata,
            publicId: bpUploaded.publicId,
            format: bpUploaded.format,
            resourceType: bpUploaded.resource_type,
            fileName: bpUploaded.original_filename,
            path: bpUploaded.url,
          },
        });
      }
      return {message: 'Update background post default successful.'};
    } catch (error) {
      return handleError(error);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/background_post/upload', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Upload a Files model instances into Container',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  })
  async uploadBackgroundPost(
    @requestBody({
      description: 'multipart/form-data',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<MediaContents[]> {
    const upload = multer({storage});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await new Promise<{files: {buffer: any}[]}>(async (resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/no-explicit-any
      await upload.any()(request, response, async (err: any) => {
        if (err) reject(err);
        else {
          const data = this.mediaContentsHandler.getFilesAndFields(request);
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          return resolve({...data});
        }
      });
    });
    const results: MediaContents[] = [];
    for (const item of res.files) {
      const mediaContent = await this.mediaContentsHandler.uploadMedia({
        file: item,
        folder: 'default_data/background_post',
        option: {mediaType: MEDIA_CONTENT_TYPE_SYSTEM_BACKGROUND_POST},
      });
      results.push(mediaContent);
    }
    return results;
  }
}
