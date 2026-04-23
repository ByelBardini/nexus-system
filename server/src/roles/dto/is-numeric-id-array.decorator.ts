import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

type NumericIdArrayPropertyOptions = {
  example?: number[];
  description?: string;
};

export function IsNumericIdArrayProperty(
  options: NumericIdArrayPropertyOptions = {},
): PropertyDecorator {
  const { example = [1, 2, 3], description } = options;
  return applyDecorators(
    ApiProperty({
      type: [Number],
      example,
      description,
    }),
    IsArray(),
    IsNumber({}, { each: true }),
  );
}
