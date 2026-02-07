import { verify } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
  const Contract = z.object({ message: z.string(), score: z.number() });

  const output = "Here is the reply:\n```json\n{ \"message\": \"ok\", \"score\": 9 }\n```";

  const res = await verify({
    output,
    contract: Contract,
    policies: []
  });
  console.log("output", output);
  console.log("res", res);
  console.log(res.allowed ? 'ALLOWED' : 'BLOCKED');
  console.log('Safe output:', res.safeOutput);
}

main();
