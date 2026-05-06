import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { validateRequest } from '../../../../../utils/validate.js';
import { ActionRequest } from 'adminjs';

class UserDto {
  @IsEmail(
    {},
    {
      message: 'Некорректный e-mail.',
    },
  )
  email: string;

  @IsString({ message: 'Должно быть строкой.' })
  @IsNotEmpty()
  @MinLength(4, {
    message: 'Должно быть длиннее или равно 4 символам',
  })
  name: string;

  @IsStrongPassword({}, { message: 'Недостаточно сложный пароль.' })
  password: string;

  @IsOptional()
  role?: any;
}

export const validateUser = async (request: ActionRequest) => {
  return await validateRequest(request, UserDto);
};
