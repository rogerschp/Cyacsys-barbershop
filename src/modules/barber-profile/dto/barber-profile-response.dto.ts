import { ApiProperty } from '@nestjs/swagger';
export class BarberProfileResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
    tenantId: string;
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
    tenantUserId: string;
    @ApiProperty({ example: 'João Barbeiro' })
    displayName: string;
    @ApiProperty({
        nullable: true,
        example: 'Especialista em cortes modernos',
    })
    bio: string | null;
    @ApiProperty({ example: 'https://example.com/avatar.jpg' })
    avatarUrl: string;
    @ApiProperty({ example: 5 })
    experienceYears: number;
    @ApiProperty({ example: true })
    isActive: boolean;
    @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
    createdAt: Date;
    @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
    updatedAt: Date;
}
