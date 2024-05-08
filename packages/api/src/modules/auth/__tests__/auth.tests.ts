import axios from 'axios';

import { accounts } from '@src/mocks/accounts';
import { generateInitialUsers } from '@src/mocks/initialSeeds/initialUsers';
import { networks } from '@src/mocks/networks';
import { RecoverCodeType } from '@src/models';
import { AuthValidations } from '@src/utils/testUtils/Auth';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

dotenv.config({ path: envPath });

describe('[AUTH]', () => {
  test(
    'Sign in with personal workspace',
    async () => {
      const auth = new AuthValidations(networks['local'], accounts['USER_1']);

      await auth.create();

      await auth.createSession().then(() => {
        expect(auth.user.address).toBe(accounts['USER_1'].address);
        expect(auth.workspace).toHaveProperty('id');
        expect(auth.workspace).toHaveProperty('single', true);
        expect(auth.authToken);
      });
    },
    10 * 1000,
  );

  test(
    'Sign in with personal workspace and select other workspace',
    async () => {
      //crate a session
      const _auth = new AuthValidations(networks['local'], accounts['USER_1']);
      await _auth.create();
      await _auth.createSession();

      //select a other workspace
      const { data } = await _auth.axios.get(`/workspace/by-user`);

      const w_upgrade = data.find(w => w.id !== _auth.workspace.id);

      //select workspace
      await _auth.selectWorkspace(w_upgrade.id).then(({ data }) => {
        expect(_auth.workspace.id).toEqual(w_upgrade.id);
        expect(_auth.user).toHaveProperty('address', accounts['USER_1'].address);
        expect(_auth.authToken).toHaveProperty('token');
      });
    },
    10 * 1000,
  );

  test('generate a code with register user', async () => {
    const api = axios.create({
      baseURL: process.env.API_URL,
    });

    const [user1] = await generateInitialUsers();

    console.log(user1.address);

    const data = await api
      .post(`/auth/code/${user1.address}`)
      .then(data => data)
      .catch(err => err);

    console.log(JSON.stringify(data));

    expect(data).toHaveProperty('code');
    expect(data).toHaveProperty('type', RecoverCodeType.AUTH);
    expect(data).toHaveProperty('validAt');
    expect(new Date(data.validAt).getTime()).toBeGreaterThan(new Date().getTime());
  });
});
