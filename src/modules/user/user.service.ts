import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { PASSWORD_HASHER, IPasswordHasher, } from '../../common/interfaces/password-hasher.interface';
import { UserSyncService } from './user-sync.service';
import { UserStatus } from './entities/user-status.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { IUserRepository, USER_REPOSITORY, } from './interfaces/user-repository.interface';
@Injectable()
export class UserService {
    constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository, 
    @Inject(PASSWORD_HASHER)
    private readonly passwordService: IPasswordHasher, private readonly userSyncService: UserSyncService) { }
    async findByFirebaseUid(firebaseUid: string) {
        return this.repo.findByFirebaseUid(firebaseUid);
    }
    async validateUserExists(firebaseUid: string): Promise<UserEntity> {
        const user = await this.repo.findByFirebaseUid(firebaseUid);
        if (!user) {
            throw new UnauthorizedException('User not found in database. Only users created through the system (DB then Firebase sync) can sign in.');
        }
        if (user.status !== UserStatus.ACTIVE) {
            throw new ForbiddenException('User is not active. Access denied.');
        }
        return user;
    }
    async syncUserWithFirebase(firebaseUid: string): Promise<UserEntity | null> {
        return this.userSyncService.syncFromFirebase(firebaseUid);
    }
    async findByEmail(email: string) {
        return this.repo.findByEmail(email);
    }
    async findById(id: string): Promise<UserEntity> {
        const user = await this.repo.findById(id);
        if (!user)
            throw new NotFoundException('User not found');
        return user;
    }
    async create(dto: CreateUserDto) {
        const existing = await this.repo.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already in use');
        }
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.repo.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            role: dto.role,
        });
        try {
            const { uid } = await this.userSyncService.createInFirebase({
                email: dto.email,
                password: dto.password,
                displayName: dto.name,
            });
            await this.repo.setFirebaseUid(user.id, uid);
            const created = await this.repo.findById(user.id);
            return created ?? user;
        }
        catch (err) {
            await this.repo.softDelete(user.id);
            throw err;
        }
    }
    async update(id: string, dto: UpdateUserDto) {
        const user = await this.repo.findById(id);
        if (!user)
            throw new NotFoundException('User not found');
        const data: {
            name?: string;
            status?: UserStatus;
            role?: Role;
            passwordHash?: string;
        } = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.password) {
            data.passwordHash = await this.passwordService.hash(dto.password);
        }
        await this.repo.update(id, data);
        if (user.firebaseUid) {
            const firebaseUpdate: {
                disabled?: boolean;
                displayName?: string;
                password?: string;
            } = {};
            if (dto.status !== undefined) {
                firebaseUpdate.disabled = dto.status !== UserStatus.ACTIVE;
            }
            if (dto.name !== undefined)
                firebaseUpdate.displayName = dto.name;
            if (dto.password)
                firebaseUpdate.password = dto.password;
            if (Object.keys(firebaseUpdate).length > 0) {
                await this.userSyncService.syncToFirebase(user.firebaseUid, firebaseUpdate);
            }
        }
        const updated = await this.repo.findById(id);
        if (!updated)
            throw new NotFoundException('User not found');
        return updated;
    }
    async delete(id: string) {
        const user = await this.repo.findById(id);
        if (!user)
            throw new NotFoundException('User not found');
        if (user.firebaseUid) {
            await this.userSyncService.disableInFirebase(user.firebaseUid);
        }
        await this.repo.softDelete(id);
    }
}
