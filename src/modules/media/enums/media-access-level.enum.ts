/** Who the API authorizes to consume the media. Distinct from MediaVisibility. */
export enum MediaAccessLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  TENANT_MEMBER = 'TENANT_MEMBER',
  OWNER_ONLY = 'OWNER_ONLY',
}
