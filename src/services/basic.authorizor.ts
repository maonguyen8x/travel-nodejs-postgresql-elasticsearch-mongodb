import {AuthorizationContext, AuthorizationMetadata, AuthorizationDecision} from '@loopback/authorization';
import {pick} from 'lodash';
import {UserProfile, securityId} from '@loopback/security';
import {PostgresqlDataSource} from '../datasources';

// Instance level authorizer
// Can be also registered as an authorizer, depends on users' need.

export async function basicAuthorization(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,
): Promise<AuthorizationDecision> {
  // No access if authorization details are missing
  let currentUser: UserProfile;
  if (authorizationCtx.principals.length > 0) {
    const user = pick(authorizationCtx.principals[0], ['id', 'name', 'roles']);
    currentUser = {[securityId]: user.id, name: user.name, roles: user.roles};
  } else {
    return AuthorizationDecision.DENY;
  }

  if (!currentUser.roles) {
    return AuthorizationDecision.DENY;
  }

  const ds = new PostgresqlDataSource();
  const chkBlocked = await ds.execute(
    `select id from users where id = ${currentUser[securityId]} and blockedat is not null`,
  );

  if (chkBlocked.length > 0) return AuthorizationDecision.DENY;

  // Authorize everything that does not have a allowedRoles property
  if (!metadata.allowedRoles) {
    return AuthorizationDecision.ALLOW;
  }

  let roleIsAllowed = false;
  for (const role of currentUser.roles.split(',')) {
    if (metadata.allowedRoles!.includes(role)) {
      roleIsAllowed = true;
      break;
    }
  }

  if (roleIsAllowed) {
    return AuthorizationDecision.ALLOW;
  }

  // Allow access only to model owners
  if (currentUser[securityId] === authorizationCtx.invocationContext.args[0]) {
    return AuthorizationDecision.ALLOW;
  }

  return AuthorizationDecision.DENY;
}
