import {UsersWithRelations} from '../../models';
import {UserWithRelatedPageId} from './user-interface';

export const convertDataUser = (user?: UsersWithRelations): UserWithRelatedPageId | null =>  {
  if (!user) {
    return null;
  }
  return {
    ...user,
    relatedPageId: user?.page?.id,
  };
}
