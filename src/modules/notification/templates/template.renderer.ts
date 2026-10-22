import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import {
  bookingCancelledTemplate,
  bookingConfirmedTemplate,
  bookingCreatedTemplate,
} from './booking-created.template';
import { NotificationTemplateContent } from './notification-template.types';
import { reviewCreatedTemplate } from './review-created.template';
import { teamInvitationTemplate } from './team-invitation.template';

type Fn = typeof teamInvitationTemplate;
const forAll = (fn: Fn): Partial<Record<NotificationChannel, Fn>> => ({
  [NotificationChannel.EMAIL]: fn,
  [NotificationChannel.PUSH]: fn,
  [NotificationChannel.TELEGRAM]: fn,
  [NotificationChannel.WHATSAPP]: fn,
});

const TEMPLATES: Partial<Record<NotificationEvent, Partial<Record<NotificationChannel, Fn>>>> = {
  [NotificationEvent.TEAM_INVITATION]: {
    [NotificationChannel.EMAIL]: teamInvitationTemplate,
  },
  [NotificationEvent.BOOKING_CREATED]: forAll(bookingCreatedTemplate),
  [NotificationEvent.BOOKING_CONFIRMED]: forAll(bookingConfirmedTemplate),
  [NotificationEvent.BOOKING_CANCELLED]: forAll(bookingCancelledTemplate),
  [NotificationEvent.REVIEW_CREATED]: forAll(reviewCreatedTemplate),
};

@Injectable()
export class TemplateRenderer {
  render(params: {
    event: NotificationEvent;
    channel: NotificationChannel;
    payload: Record<string, unknown>;
  }): NotificationTemplateContent {
    const byChannel = TEMPLATES[params.event];
    const template =
      byChannel?.[params.channel] ??
      byChannel?.[NotificationChannel.EMAIL];
    if (!template) {
      throw new NotFoundException(
        `No notification template for ${params.event}/${params.channel}`,
      );
    }
    return template(params.payload);
  }
}
