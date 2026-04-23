import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../entities/user-status.enum';
export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ nullable: true, description: 'UID do Firebase Auth' })
  firebaseUid: string | null;
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;
  @ApiProperty({ example: 'João Silva' })
  name: string;
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;
  @ApiProperty({ enum: Role })
  role: Role;
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
