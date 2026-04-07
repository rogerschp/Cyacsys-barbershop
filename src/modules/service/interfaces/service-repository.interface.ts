import { ServiceEntity } from '../entities/service.entity';
export interface CreateServiceData {
    tenantId: string;
    name: string;
    description?: string | null;
    price: string;
    durationInMinutes: number;
}
export interface UpdateServiceData {
    name?: string;
    description?: string | null;
    price?: string;
    durationInMinutes?: number;
    isActive?: boolean;
}
export interface IServiceRepository {
    create(data: CreateServiceData): Promise<ServiceEntity>;
    findById(id: string, tenantId: string): Promise<ServiceEntity | null>;
    findNonDeletedByName(tenantId: string, name: string, excludeId?: string): Promise<ServiceEntity | null>;
    listByTenant(tenantId: string): Promise<ServiceEntity[]>;
    update(id: string, tenantId: string, data: UpdateServiceData): Promise<ServiceEntity>;
    softDelete(id: string, tenantId: string): Promise<ServiceEntity>;
}
export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');
