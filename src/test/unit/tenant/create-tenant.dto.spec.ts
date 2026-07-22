import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTenantDto } from 'src/modules/tenant/dto/create-tenant.dto';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';

describe('CreateTenantDto', () => {
  const base = {
    name: 'Barbearia do Vitinho',
    telephone: '5511992834085',
  };

  it('aceita telephone no formato documentado (E.164 sem +)', async () => {
    const dto = plainToInstance(CreateTenantDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.telephone).toBe('5511992834085');
  });

  it('normaliza telephone mascarado e com +', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      telephone: '+55 (11) 99283-4085',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.telephone).toBe('5511992834085');
  });

  it('aceita telephone local BR e prefixa 55', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      telephone: '11992834085',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.telephone).toBe('5511992834085');
  });

  it('rejeita telephone ausente', async () => {
    const dto = plainToInstance(CreateTenantDto, { name: base.name });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'telephone')).toBe(true);
  });

  it('rejeita telephone inválido', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      telephone: '123',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'telephone')).toBe(true);
  });

  it('normaliza e aceita CNPJ válido mascarado', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      cnpj: '11.222.333/0001-81',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.cnpj).toBe('11222333000181');
  });

  it('rejeita CNPJ com dígitos verificadores inválidos', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      cnpj: '12345678000199',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cnpj')).toBe(true);
  });

  it('rejeita CNPJ sequência repetida', async () => {
    const dto = plainToInstance(CreateTenantDto, {
      ...base,
      cnpj: '11111111111111',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cnpj')).toBe(true);
  });
});

describe('CreateAddressDto CEP', () => {
  const base = {
    street: 'Rua A',
    number: '1',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
  };

  it('normaliza CEP sem hífen', async () => {
    const dto = plainToInstance(CreateAddressDto, {
      ...base,
      zipCode: '01001000',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.zipCode).toBe('01001-000');
  });

  it('aceita CEP já formatado', async () => {
    const dto = plainToInstance(CreateAddressDto, {
      ...base,
      zipCode: '01001-000',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.zipCode).toBe('01001-000');
  });

  it('rejeita CEP com menos de 8 dígitos', async () => {
    const dto = plainToInstance(CreateAddressDto, {
      ...base,
      zipCode: '01001',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'zipCode')).toBe(true);
  });

  it('rejeita CEP 00000-000', async () => {
    const dto = plainToInstance(CreateAddressDto, {
      ...base,
      zipCode: '00000000',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'zipCode')).toBe(true);
  });
});
