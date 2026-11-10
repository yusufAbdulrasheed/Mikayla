export function mongoOptions(uri = process.env.MONGODB_URI || '') {
  const namesDatabase = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(uri);
  return {
    serverSelectionTimeoutMS: 8000,
    ...(namesDatabase && !process.env.MONGODB_DB ? {} : { dbName: process.env.MONGODB_DB || 'mikayla' }),
  };
}
