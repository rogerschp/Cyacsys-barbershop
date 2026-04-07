export interface FirebaseSignInResponse {
    idToken: string;
    refreshToken: string;
    expiresIn: string | number;
    localId?: string;
    email?: string;
    registered?: boolean;
}
