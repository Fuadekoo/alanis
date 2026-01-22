// In-memory storage for OAuth codes
// In production, consider using Redis or database for distributed systems
const oauthCodes = new Map<
  string,
  {
    userId: string;
    expiresAt: Date;
    used: boolean;
  }
>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [code, data] of oauthCodes.entries()) {
    if (data.expiresAt < now) {
      oauthCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

export { oauthCodes };

