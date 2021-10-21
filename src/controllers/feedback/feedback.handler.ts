import {repository} from '@loopback/repository';
import {FeedbackRepository, UserEmailRepository} from '../../repositories';
import {Feedback} from '../../models';
import {feedbackStatusEnum} from './feedback.constant';
import {inject} from '@loopback/context';
import {NotificationLogicController} from '../notification/notification-logic.controller';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../../constants/error.constant';
import {handleError} from '../../utils/handleError';

export class FeedbackHandler {
  constructor(
    @repository(FeedbackRepository)
    public feedbackRepository: FeedbackRepository,
    @repository(UserEmailRepository)
    public userEmailRepository: UserEmailRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  async create(feedback: Omit<Feedback, 'id'>, userId: number): Promise<Feedback> {
    const result = await this.feedbackRepository.create({
      ...feedback,
      userId,
      status: feedbackStatusEnum.WAITING_FOR_PROCESSING,
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.notifyForAdmin({
      feedback: result,
    });

    return result;
  }

  async feedbackUnblockAccount(newFeedbackUnblockAccountRequest: {content: string; email: string}): Promise<Feedback> {
    try {
      const email = await this.userEmailRepository.findOne({
        where: {
          email: newFeedbackUnblockAccountRequest.email,
        },
      });
      if (!email) {
        throw new HttpErrors.NotFound(ErrorCode.INVALID_EMAIL);
      } else {
        const result = await this.feedbackRepository.create({
          content: newFeedbackUnblockAccountRequest.content,
          status: feedbackStatusEnum.WAITING_FOR_PROCESSING,
          userId: email.userId,
        });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.notificationLogicController.notifyForAdmin({
          feedback: result,
        });
        return result;
      }
    } catch (error) {
      return handleError(error);
    }
  }
}
