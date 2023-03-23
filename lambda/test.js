import * as index from './index.js';

await index.handlerInternal(
  {},
  process.env.PULUMI_ACCESS_TOKEN,
  process.env.DD_API_KEY,
  process.env.DD_API_KEY,
  "jkodrofftest",
);