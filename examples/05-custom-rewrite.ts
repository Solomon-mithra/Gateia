import { verify, Policy } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Contract = z.object({ message: z.string() });

  const censorPolicy: Policy<{ message: string }> = {
    id: 'censor-bad-words',
    mode: 'enforce',
    check: (output) => {
      if (output.message.includes('darn')) {
        return {
          outcome: 'rewrite',
          rewriteFn: (o) => ({ ...o, message: o.message.replace('darn', '****') })
        };
      }
      return { outcome: 'pass' };
    }
  };

  const res = await verify({
    output: { message: 'That implies darn risk' },
    contract: Contract,
    policies: [censorPolicy]
  });

  console.log(res.allowed ? 'ALLOWED' : 'BLOCKED');
  console.log('Safe output:', res.safeOutput);
}

main();
