import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'coordinatesPair', async: false })
export class CoordinatesPairConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as {
      latitude?: number | null;
      longitude?: number | null;
    };
    const hasLat = obj.latitude !== undefined && obj.latitude !== null;
    const hasLng = obj.longitude !== undefined && obj.longitude !== null;
    const latIsNull = obj.latitude === null;
    const lngIsNull = obj.longitude === null;

    if (latIsNull || lngIsNull) {
      return latIsNull && lngIsNull;
    }

    return hasLat === hasLng;
  }

  defaultMessage(): string {
    return 'Latitude e longitude devem ser informadas juntas.';
  }
}
