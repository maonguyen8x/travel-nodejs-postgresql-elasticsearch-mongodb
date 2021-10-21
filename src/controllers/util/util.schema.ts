import {getModelSchemaRef} from '@loopback/openapi-v3';
import {
  AccommodationType,
  Activity,
  Currency,
  CustormStringObject,
  FoodGeneralInformation,
  Interesting,
  Locations,
  MediaContents,
  Page,
  Posts,
  Service,
  Stay,
  TimeToOrganizeTour,
} from '../../models';

export const schemaHome = {
  type: 'object',
  properties: {
    count: {
      type: 'number',
    },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          pageId: {
            type: 'number',
          },
          totalRanking: {
            type: 'number',
          },
          hadInteresting: {
            type: 'boolean',
          },
          isSavedLocation: {
            type: 'boolean',
          },
          pageFoodGeneralInformation: getModelSchemaRef(FoodGeneralInformation),
          pageFoodPrice: {
            type: 'object',
            properties: {
              minPrice: {
                type: 'object',
                properties: {
                  value: {
                    type: 'number',
                  },
                  currency: getModelSchemaRef(Currency),
                },
              },
              maxPrice: {
                type: 'object',
                properties: {
                  value: {
                    type: 'number',
                  },
                  currency: getModelSchemaRef(Currency),
                },
              },
            },
          },
          pageFoodReview: {
            type: 'object',
            properties: {
              totalReview: {
                type: 'number',
              },
              averagePoint: {
                type: 'number',
              },
            },
          },
          interesting: getModelSchemaRef(Interesting),
          attachments: {
            type: 'object',
            properties: {
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
  },
};
export const schemaTour = {
  type: 'object',
  properties: {
    count: {
      type: 'number',
    },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          pageId: {
            type: 'number',
          },
          serviceId: {
            type: 'number',
          },
          totalRanking: {
            type: 'number',
          },
          hadInteresting: {
            type: 'boolean',
          },
          isSavedLocation: {
            type: 'boolean',
          },
          interesting: getModelSchemaRef(Interesting),
          tour: {
            type: 'object',
            properties: {
              currency: getModelSchemaRef(Currency),
              tourName: {
                type: 'string',
              },
              id: {
                type: 'number',
              },
              price: {
                type: 'number',
              },
              currencyId: {
                type: 'number',
              },
              destinations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    formatedAddress: {
                      type: 'string',
                    },
                  },
                },
              },
              isDailyTour: {
                type: 'boolean',
              },
              dateOff: {
                type: 'array',
                items: getModelSchemaRef(CustormStringObject),
              },
              startDate: {
                type: 'string',
              },
              endDate: {
                type: 'string',
              },
              totalTourTime: {
                type: 'object',
                properties: {
                  day: {
                    type: 'number',
                  },
                  night: {
                    type: 'number',
                  },
                },
              },
              timeToOrganizeTour: {
                type: 'array',
                items: getModelSchemaRef(TimeToOrganizeTour, {
                  exclude: ['id', 'tourId', 'createdAt', 'updatedAt', 'deletedAt'],
                }),
              },
            },
          },
          attachments: {
            type: 'object',
            properties: {
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
  },
};
export const schemaStay = {
  type: 'object',
  properties: {
    count: {
      type: 'number',
    },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          pageId: {
            type: 'number',
          },
          serviceId: {
            type: 'number',
          },
          hadInteresting: {
            type: 'boolean',
          },
          isSavedLocation: {
            type: 'boolean',
          },
          interesting: getModelSchemaRef(Interesting),
          service: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Service).definitions.Service.properties,
              currency: getModelSchemaRef(Currency),
            },
          },
          page: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Page).definitions.Page.properties,
            },
          },
          stay: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Stay).definitions.Stay.properties,
              accommodationType: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
                },
              },
            },
          },
          attachments: {
            type: 'object',
            properties: {
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
  },
};
export const schemaActivity = {
  type: 'object',
  properties: {
    count: {
      type: 'number',
    },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          activity: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Activity).definitions.Activity.properties,
              currency: getModelSchemaRef(Currency),
              location: getModelSchemaRef(Locations),
            },
          },
          location: getModelSchemaRef(Locations),
          post: getModelSchemaRef(Posts),
          attachments: {
            type: 'object',
            properties: {
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
  },
};
