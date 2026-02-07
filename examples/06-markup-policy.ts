import { verify } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Contract = z.object({ html: z.string() });

  const bad = await verify({
    output: { html: '<img onerror=alert(1) src=x>' },
    contract: Contract,
    policies: ['markup-safe']
  });

  const ok = await verify({
    output: { html: 'See https://example.com/docs' },
    contract: Contract,
    policies: ['markup-safe']
  });
  console.log('ok',ok);
  console.log('Bad allowed:', bad.allowed);
  console.log('Ok allowed:', ok.allowed);
}

main();
