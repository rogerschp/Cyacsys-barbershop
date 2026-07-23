export enum MediaStatus {
  /** Reserved for async/queue uploads (BullMQ/SQS). Sync MVP does not use this. */
  UPLOADING = 'UPLOADING',
  AVAILABLE = 'AVAILABLE',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}
