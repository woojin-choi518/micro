import neo4j, { Driver } from 'neo4j-driver';

declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver: Driver | undefined;
}
/* eslint-enable no-var */

const uri      = process.env.NEO4J_URI!;
const user     = process.env.NEO4J_USER!;
const password = process.env.NEO4J_PASSWORD!;
console.log('🔍 NEO4J_URI loaded by Next:', process.env.NEO4J_URI);
export const driver: Driver =
  globalThis.__neo4jDriver ??
  (globalThis.__neo4jDriver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password),
    { encrypted: 'ENCRYPTION_OFF' }
  ));