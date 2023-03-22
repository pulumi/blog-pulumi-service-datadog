import * as index from './index.js';

index.handlerInternal(
  {},
  process.env.PULUMI_ACCESS_TOKEN,
  process.env.DATADOG_API_KEY,
  process.env.DATADOG_APP_KEY,
  "jkodrofftest",
);