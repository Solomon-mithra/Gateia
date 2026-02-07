import { verify } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Reply = z.object({ reply: z.string() });

  const res = await verify({
    output: { reply: 'Refund guaranteed. Email me at test@example.com' },
    contract: Reply,
    policies: ['finance-safe', 'pii-safe']
  });

  console.log(res.allowed ? 'ALLOWED' : 'BLOCKED');
  console.log(res.enforcement.violations.map(v => `${v.policyId}:${v.code}`));
}

main();
