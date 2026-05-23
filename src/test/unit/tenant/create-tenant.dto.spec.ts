import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTenantDto } from 'src/modules/tenant/dto/create-tenant.dto';

describe('CreateTenantDto', () => {
  const base = {
    name: 'Barbearia do Vitinho',
    telephone: '5511992834085',
  };

  it('aceita telephone no formato documentado (E.164 sem +)', async () => {
    const dto = plainToInstance(CreateTenantDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita telephone com + opcional', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      telephone: '+5511992834085',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita telephone ausente', async () => {
    const dto = plainToInstance(CreateTenantDto, { name: base.name });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'telephone')).toBe(true);
  });

  it('rejeita telephone como número (deve ser string)', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      telephone: 5511992834085,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'telephone')).toBe(true);
  });
});
