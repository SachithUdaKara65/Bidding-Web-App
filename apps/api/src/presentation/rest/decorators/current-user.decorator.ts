import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@procurement/shared-types';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  }
);
