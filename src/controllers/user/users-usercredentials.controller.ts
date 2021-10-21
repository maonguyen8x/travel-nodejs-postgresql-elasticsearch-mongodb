// import {
//   Count,
//   CountSchema,
//   Filter,
//   repository,
//   Where,
// } from '@loopback/repository';
// import {
//   del,
//   get,
//   getModelSchemaRef,
//   getWhereSchemaFor,
//   param,
//   patch,
//   post,
//   requestBody,
// } from '@loopback/rest';
// import {Usercredentials, Users} from '../models';
// import {UsersRepository} from '../repositories';
//
// export class UsersUsercredentialsController {
//   constructor(
//     @repository(UsersRepository) protected usersRepository: UsersRepository,
//   ) {}
//
//   @get('/users/{id}/usercredentials', {
//     responses: {
//       '200': {
//         description: 'Users has one Usercredentials',
//         content: {
//           'application/json': {
//             schema: getModelSchemaRef(Usercredentials),
//           },
//         },
//       },
//     },
//   })
//   async get(
//     @param.path.number('id') id: number,
//     @param.query.object('filter') filter?: Filter<Usercredentials>,
//   ): Promise<Usercredentials> {
//     return this.usersRepository.usercredentials(id).get(filter);
//   }
//
//   @post('/users/{id}/usercredentials', {
//     responses: {
//       '200': {
//         description: 'Users model instance',
//         content: {
//           'application/json': {schema: getModelSchemaRef(Usercredentials)},
//         },
//       },
//     },
//   })
//   async create(
//     @param.path.number('id') id: typeof Users.prototype.id,
//     @requestBody({
//       content: {
//         'application/json': {
//           schema: getModelSchemaRef(Usercredentials, {
//             title: 'NewUsercredentialsInUsers',
//             exclude: ['id'],
//             optional: ['usersId'],
//           }),
//         },
//       },
//     })
//     usercredentials: Omit<Usercredentials, 'id'>,
//   ): Promise<Usercredentials> {
//     return this.usersRepository.usercredentials(id).create(usercredentials);
//   }
//
//   @patch('/users/{id}/usercredentials', {
//     responses: {
//       '200': {
//         description: 'Users.Usercredentials PATCH success count',
//         content: {'application/json': {schema: CountSchema}},
//       },
//     },
//   })
//   async patch(
//     @param.path.number('id') id: number,
//     @requestBody({
//       content: {
//         'application/json': {
//           schema: getModelSchemaRef(Usercredentials, {partial: true}),
//         },
//       },
//     })
//     usercredentials: Partial<Usercredentials>,
//     @param.query.object('where', getWhereSchemaFor(Usercredentials))
//     where?: Where<Usercredentials>,
//   ): Promise<Count> {
//     return this.usersRepository
//       .usercredentials(id)
//       .patch(usercredentials, where);
//   }
//
//   @del('/users/{id}/usercredentials', {
//     responses: {
//       '200': {
//         description: 'Users.Usercredentials DELETE success count',
//         content: {'application/json': {schema: CountSchema}},
//       },
//     },
//   })
//   async delete(
//     @param.path.number('id') id: number,
//     @param.query.object('where', getWhereSchemaFor(Usercredentials))
//     where?: Where<Usercredentials>,
//   ): Promise<Count> {
//     return this.usersRepository.usercredentials(id).delete(where);
//   }
// }
