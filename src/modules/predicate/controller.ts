import { error } from '@utils/error';
import { Responses, bindMethods, successful } from '@utils/index';

import {
  ICreatePredicateRequest,
  IDeletePredicateRequest,
  IFindByHashRequest,
  IFindByIdRequest,
  IListRequest,
  IPredicateService, // IUpdatePredicateRequest,
} from './types';

export class PredicateController {
  private predicateService: IPredicateService;

  constructor(predicateService: IPredicateService) {
    this.predicateService = predicateService;
    bindMethods(this);
  }

  async create({ body: payload }: ICreatePredicateRequest) {
    try {
      const response = await this.predicateService.create(payload);
      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async delete({ params: { id } }: IDeletePredicateRequest) {
    try {
      const response = await this.predicateService.delete(id);

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async findById({ params: { id } }: IFindByIdRequest) {
    try {
      const response = await this.predicateService.findById(id);

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async findByAddress({ params: { address } }: IFindByHashRequest) {
    try {
      const response = await this.predicateService
        .filter({
          address,
        })
        .list();

      return successful(response[0], Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async list(req: IListRequest) {
    const { provider, owner, orderBy, sort, page, perPage, q } = req.query;
    const { address } = req.user;

    try {
      const response = await this.predicateService
        .filter({ address, signer: address, provider, owner, q })
        .ordination({ orderBy, sort })
        .paginate({ page, perPage })
        .list();

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }
}
