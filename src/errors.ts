export class AuthenticationError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class TokenTypeError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, TokenTypeError.prototype);
  }
}
