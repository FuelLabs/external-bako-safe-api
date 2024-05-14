import path from 'path';
import dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';
import { IBakoSafeApi } from 'bakosafe';
import { Provider, Wallet } from 'fuels';

import { TypeUser } from '@src/models';

import { IDefaultAccount } from '../../mocks/accounts';
const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

dotenv.config({ path: envPath });

export type IUserAuth = {
  id: string;
  avatar: string;
  address: string;
};

//todo: repply this class on SDK to user autentication resource
export class AuthValidations {
  public user: IUserAuth;
  public authToken: IBakoSafeApi;
  public axios: AxiosInstance;
  public workspace: {
    id: string;
    name: string;
    avatar: string;
  };
  public code: string;

  constructor(
    private readonly provider: string,
    private readonly account: IDefaultAccount,
  ) {
    this.axios = axios.create({
      baseURL: process.env.API_URL,
    });
  }
  async create() {
    const { data } = await this.axios.post('/user', {
      address: this.account.address,
      provider: this.provider,
      type: TypeUser.FUEL,
    });

    this.code = data.code;
  }

  async createSession() {
    const tx = await this.signer(this.code);

    const { data } = await this.axios.post('/auth/sign-in', {
      digest: this.code,
      encoder: TypeUser.FUEL,
      signature: tx,
    });

    this.axios.defaults.headers.common['Authorization'] = data.accessToken;
    this.axios.defaults.headers.common['Signeraddress'] = data.address;
    this.authToken = {
      address: data.address,
      token: data.accessToken,
    };

    this.user = {
      id: data.user_id,
      address: data.address,
      avatar: data.avatar,
    };

    this.workspace = data.workspace;
  }

  async selectWorkspace(workspaceId: string) {
    const { data } = await this.axios.put('/auth/workspace', {
      workspace: workspaceId,
      user: this.user.id,
      ...this.authToken,
    });

    this.workspace = data.workspace;
    return data;
  }

  async listMyWorkspaces() {
    const { data } = await this.axios.get(`/workspace/by-user`);
    return data;
  }

  async signer(message: string) {
    const provider = await Provider.create(this.provider);
    const signer = Wallet.fromPrivateKey(this.account.privateKey, provider);
    return await signer.signMessage(message);
  }
}
