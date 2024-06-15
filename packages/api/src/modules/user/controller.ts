import { addMinutes } from 'date-fns';

import { PredicateVersion, RecoverCode, RecoverCodeType } from '@src/models';
import { TypeUser, User } from '@src/models/User';
import { bindMethods } from '@src/utils/bindMethods';

import {
  BadRequest,
  ErrorTypes,
  Unauthorized,
  UnauthorizedErrorTitles,
  error,
} from '@utils/error';
import { IconUtils } from '@utils/icons';
import { Responses, successful } from '@utils/index';

import { PredicateService } from '../predicate/services';
import { RecoverCodeService } from '../recoverCode/services';
import { TransactionService } from '../transaction/services';
import { UserService } from './service';
import {
  ICheckHardwareRequest,
  ICheckNicknameRequest,
  ICreateRequest,
  IDeleteRequest,
  IFindOneRequest,
  IListRequest,
  IMeRequest,
  IUpdateRequest,
  IUserService,
} from './types';
import { BakoSafe, Vault } from 'bakosafe';
import { Provider } from 'fuels';

export class UserController {
  private userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
    bindMethods(this);
  }

  async find(req: IListRequest) {
    try {
      const { user, active, orderBy, sort, page, perPage } = req.query;

      const response = await this.userService
        .filter({ user, active })
        .ordination({ orderBy, sort })
        .paginate({ page, perPage })
        .find();

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async info(req: IListRequest) {
    const { user } = req;

    return successful(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        first_login: user.first_login,
        notify: user.notify,
      },
      Responses.Ok,
    );
  }

  async me(req: IMeRequest) {
    try {
      //list all 8 last vaults of user
      const { workspace, user } = req;
      const { workspaceList, hasSingle } = await new UserService().workspacesByUser(
        workspace,
        user,
      );

      const predicates = await new PredicateService()
        .filter({
          workspace: workspaceList,
          signer: hasSingle ? user.address : undefined,
        })
        .paginate({ page: '0', perPage: '8' })
        .ordination({ orderBy: 'updatedAt', sort: 'DESC' })
        .list();

      const transactions = await new TransactionService()
        .filter({
          workspaceId: workspaceList,
          signer: hasSingle ? user.address : undefined,
        })
        .paginate({ page: '0', perPage: '6' })
        .ordination({ orderBy: 'createdAt', sort: 'DESC' })
        .list();

      return successful(
        {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            avatar: workspace.avatar,
            owner: workspace.owner,
            description: workspace.description,
          },
          predicates,
          transactions,
        },
        Responses.Ok,
      );
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  /* - add new request veryfi name disponibility /user/name:name
   *      - returns true if exists or false if not
   */

  async validateName(req: ICheckNicknameRequest) {
    try {
      const { nickname } = req.params;
      const response = await User.findOne({
        where: { name: nickname },
      })
        .then(response => {
          const { first_login, notify, active, email, ...rest } = response;
          return rest;
        })
        .catch(e => {
          return {};
        });

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  //verify used name
  async create(req: ICreateRequest) {
    try {
      const { address, name, provider, type } = req.body;

      //verify user exists
      let existingUser = await this.userService.findByAddress(address);

      if (!existingUser) {
        //verify name exists
        const existingName = await User.findOne({ where: { name } });
        if (name && existingName) {
          throw new BadRequest({
            type: ErrorTypes.Create,
            title: 'Error on user create',
            detail: `User with name ${name} already exists`,
          });
        }

        //create
        existingUser = await this.userService.create({
          ...req.body,
          name: name ?? address,
          avatar: IconUtils.user(),
          webauthn: {
            ...req.body.webauthn,
            predicate_id: '',
            predicate_address: '',
          },
        });

        if (type == TypeUser.WEB_AUTHN) {
          const { id, predicateAddress } = await this.abstractAccount(
            existingUser,
            provider,
          );
          existingUser.webauthn.predicate_id = id;
          existingUser.webauthn.predicate_address = predicateAddress;
          await existingUser.save();
        }
      }

      const code = await new RecoverCodeService()
        .create({
          owner: existingUser,
          type: RecoverCodeType.AUTH,
          origin: req.headers.origin ?? process.env.UI_URL,
          validAt: addMinutes(new Date(), 5), //todo: change this number to dynamic
        })
        .then((data: RecoverCode) => {
          const { owner, ...rest } = data;
          return {
            ...rest,
            userId: owner.id,
          };
        });

      return successful(code, Responses.Created);
    } catch (e) {
      console.log(e);
      return error(e.error, e.statusCode);
    }
  }

  async getByHardware(req: ICheckHardwareRequest) {
    try {
      const { hardware } = req.params;

      const result = await User.query(
        `SELECT * FROM "users" WHERE webauthn->>'hardware' = $1`,
        [hardware],
      );

      return successful(result, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async findOne(req: IFindOneRequest) {
    try {
      const { id } = req.params;

      const response = await this.userService.findOne(id);

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async update(req: IUpdateRequest) {
    try {
      const { user } = req;
      const { id } = req.params;

      if (user.id !== id) {
        throw new Unauthorized({
          type: ErrorTypes.Update,
          title: UnauthorizedErrorTitles.INVALID_PERMISSION,
          detail: `User id ${user.id} is not allowed to update user id ${id}`,
        });
      }

      const response = await this.userService.update(id, {
        ...req.body,
      });

      return successful(response, Responses.Ok);
    } catch (e) {
      console.log(e);
      return error(e.error, e.statusCode);
    }
  }

  async delete(req: IDeleteRequest) {
    try {
      const { id } = req.params;
      const response = await this.userService.delete(id);

      return successful(response, Responses.Ok);
    } catch (e) {
      return error(e.error, e.statusCode);
    }
  }

  async abstractAccount(user: User, provider_url: string) {
    // crie um predicate 1:1 com o usuário
    const provider = await Provider.create(provider_url);
    const predicate = await Vault.create({
      configurable: {
        SIGNATURES_COUNT: 1,
        SIGNERS: [user.address],
        network: BakoSafe.getProviders('CHAIN_URL'),
        chainId: provider.getChainId(),
      },
    });

    const version = await PredicateVersion.findOne({
      where: { code: predicate.version },
    });

    return await new PredicateService().create({
      name: `Abstract account ${user.address}`,
      description: `Account predicate by ${user.address}`,
      provider: predicate.provider.url,
      chainId: predicate.provider.getChainId(),
      predicateAddress: predicate.address.toString(),
      minSigners: 1,
      configurable: JSON.stringify({ ...predicate.getConfigurable() }),
      addresses: [user.address],
      user,
      owner: user,
      version,
    });
  }
}
