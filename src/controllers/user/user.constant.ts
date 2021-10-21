import {getModelSchemaRef, ReferenceObject, SchemaObject} from '@loopback/rest';
import {Users, Profiles, Avatars, MediaContents} from '../../models';

interface ISchema {
  type: string;
  properties: {
    [x: string]: ReferenceObject | SchemaObject;
  };
}

export const ACCOUNT_HAS_BEEN_BLOCKED = 'ACCOUNT_HAS_BEEN_BLOCKED';

export const mediaContentSchema = () => {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
    },
  };
};

export const avatarsSchema = ({mediaContent}: {mediaContent?: ISchema}): ISchema => {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Avatars).definitions.Avatars.properties,
      ...(mediaContent ? {mediaContent: mediaContent} : {}),
    },
  };
};

export const profileSchema = ({avatars}: {avatars?: ISchema}): ISchema => {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Profiles).definitions.Profiles.properties,
      ...(avatars ? {avatars: avatars} : {}),
    },
  };
};

export const userSchema = ({profiles}: {profiles?: ISchema}): ISchema => {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Users).definitions.Users.properties,
      ...(profiles ? {profiles: profiles} : {}),
    },
  };
};
