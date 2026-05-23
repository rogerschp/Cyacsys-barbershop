import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';
import { Type } from 'class-transformer';

export class RegisterUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'senhaSegura123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ example: '5511992834085' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({ type: CreateAddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}
