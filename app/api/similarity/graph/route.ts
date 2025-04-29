// app/api/similarity/graph/route.ts
import { NextResponse } from 'next/server';
import { driver } from '../../../lib/neo4j'

export async function GET() {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (a:Sample)-[r:SHARED_ASV]->(b:Sample)
      WHERE r.count >= 2
      RETURN a.sample_id AS source, b.sample_id AS target, r.count AS sharedCount
      LIMIT 1000
    `);

    const links = result.records.map((record) => ({
      source: record.get('source'),
      target: record.get('target'),
      sharedCount: record.get('sharedCount').toNumber?.() || record.get('sharedCount'),
    }));

    const nodes = Array.from(new Set(links.flatMap(link => [link.source, link.target])))
      .map(id => ({ id }));

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch similarity graph' }, { status: 500 });
  } finally {
    await session.close();
  }
}
