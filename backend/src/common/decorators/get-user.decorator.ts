import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../../users/entities/user.entity";

/**
 * Custom decorator to extract the authenticated user from the request.
 * Used in conjunction with JwtAuthGuard to get user data from JWT token.
 *
 * @returns The authenticated user object attached to the request by JwtAuthGuard
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
