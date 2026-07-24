import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import { bookingCreatedTemplate } from './booking-created.template';
import { NotificationTemplateContent } from './notification-template.types';
import { reviewCreatedTemplate } from './review-created.template';
import { teamInvitationTemplate } from './team-invitation.template';

const TEMPLATES: Partial<
  Record<
    NotificationEvent,
    Partial<Record<NotificationChannel, typeof teamInvitationTemplate>>
  >
> = {
  [NotificationEvent.TEAM_INVITATION]: {
    [NotificationChannel.EMAIL]: teamInvitationTemplate,
  },
  [NotificationEvent.BOOKING_CREATED]: {
    [NotificationChannel.EMAIL]: bookingCreatedTemplate,
  },
  [NotificationEvent.REVIEW_CREATED]: {
    [NotificationChannel.EMAIL]: reviewCreatedTemplate,
  },
};

@Injectable()
export class TemplateRenderer {
  render(params: {
    event: NotificationEvent;
    channel: NotificationChannel;
    payload: Record<string, unknown>;
  }): NotificationTemplateContent {
    const template = TEMPLATES[params.event]?.[params.channel];
    if (!template) {
      throw new NotFoundException(
        `No notification template for ${params.event}/${params.channel}`,
      );
    }
    return template(params.payload);
  }
}
