export interface IDecodedToken {
  uid: string;
  email?: string | null;
  [key: string]: unknown;
}
