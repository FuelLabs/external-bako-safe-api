import { Router } from 'express';
import {
  authMiddleware,
  predicateWorkspacePermissionMiddleware,
} from '@src/middlewares';
import { PermissionRoles } from '@src/models';
import { APITokenController } from '@modules/apiToken/controller';
import { handleResponse } from '@src/utils';
import { APITokenService } from '@modules/apiToken/service';
import { PredicateService } from '@modules/predicate/services';
import {
  validateCreateAPITokenParams,
  validateCreateAPITokenPayload,
  validateDeleteAPITokenParams,
  validateListAPITokenParams,
} from '@modules/apiToken/validations';

const router = Router();
const permissionMiddleware = predicateWorkspacePermissionMiddleware({
  permissions: [
    PermissionRoles.OWNER,
    PermissionRoles.ADMIN,
    PermissionRoles.MANAGER,
  ],
  predicateSelector: req => req.params.predicateId,
});

const { create, list, delete: deleteAPIToken } = new APITokenController(
  new APITokenService(),
  new PredicateService(),
);

router.use(authMiddleware);

router.post(
  '/:predicateId',
  validateCreateAPITokenParams,
  validateCreateAPITokenPayload,
  permissionMiddleware,
  handleResponse(create),
);

router.delete(
  '/:predicateId/:id',
  validateDeleteAPITokenParams,
  permissionMiddleware,
  handleResponse(deleteAPIToken),
);

router.get(
  '/:predicateId',
  validateListAPITokenParams,
  permissionMiddleware,
  handleResponse(list),
);

export default router;
