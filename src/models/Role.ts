import { Column, Entity } from 'typeorm';

import { Modules } from '@middlewares/permissions/types';

import { Base } from './Base';

export type PermissionsItem = {
  view: boolean;
  edit: boolean;
  remove: boolean;
};

export type Permissions = { [K in Modules]: PermissionsItem };

@Entity('roles')
class Role extends Base {
  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @Column('simple-json')
  permissions: Permissions;
}

export default Role;
