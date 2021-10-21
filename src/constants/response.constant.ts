export const contentResponseSuccess = {
  'application/json': {
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
      },
    },
  },
};

export const reponseSuccess: {success: boolean} = {success: true};
