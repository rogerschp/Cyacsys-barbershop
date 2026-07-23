import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import { IBookingRepository } from '../../booking/interfaces/booking-repository.interface';

export async function assertCompletedBookingForReview(params: {
  bookingRepository: IBookingRepository;
  reviewerUserId: string;
  targetType: ReviewTargetType;
  targetId: string;
}): Promise<void> {
  const { bookingRepository, reviewerUserId, targetType, targetId } = params;

  const exists =
    targetType === ReviewTargetType.TENANT
      ? await bookingRepository.existsCompletedForReviewer({
          reviewerUserId,
          tenantId: targetId,
        })
      : await bookingRepository.existsCompletedForReviewer({
          reviewerUserId,
          professionalProfileId: targetId,
        });

  if (!exists) {
    throw new TenantForbiddenException(
      'BOOKING_REQUIRED_FOR_REVIEW',
      'É necessário ter um agendamento concluído para avaliar.',
    );
  }
}
