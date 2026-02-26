/**
 * Resposta bruta da API Firebase Identity Toolkit (signInWithPassword).
 * @see https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password
 */
export interface FirebaseSignInResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string | number;
  localId?: string;
  email?: string;
  registered?: boolean;
}
