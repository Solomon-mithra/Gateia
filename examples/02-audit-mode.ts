import { verify } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Reply = z.object({ reply: z.string() });

  const res = await verify({
    output: { reply: '100% guaranteed return' },
    contract: Reply,
    policies: ['finance-safe'],
    mode: 'audit'
  });

  console.log(res.allowed ? 'ALLOWED (AUDIT)' : 'BLOCKED');
  console.log(`Violations recorded: ${res.enforcement.violations.length}`);
}

main();
