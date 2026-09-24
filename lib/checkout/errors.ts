/** A checkout problem the customer should see as-is (bad input, unavailable item, not configured). */
export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
