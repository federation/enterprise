export class AuthenticationError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class TokenVerificationError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, TokenVerificationError.prototype);
  }
}
