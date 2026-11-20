import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Only validate the request body
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      const error = result.error as ZodError;
      const formattedErrors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    return result.data;
  }
}
