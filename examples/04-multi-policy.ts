import { verify } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Contract = z.object({ message: z.string() });

  const res = await verify({
    output: { message: 'Guaranteed returns. Email test@example.com with key sk-0123456789abcdef' },
    contract: Contract,
    policies: ['finance-safe', 'pii-safe', 'secrets-safe']
  });

  console.log(res.allowed ? 'ALLOWED' : 'BLOCKED');
  console.log(res.enforcement.violations.map(v => `${v.policyId}:${v.code}`));
}

main();
