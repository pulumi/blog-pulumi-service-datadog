# blog-pulumi-service-datadog

Code to accompany a blog post on scraping the Pulumi Service to send metrics to DataDog.

Metrics will be scraped by default from whatever org into which you deploy the stack under `pulumi`. To override the default, set the `pulumiOrg` config value on the stack.

To test the Lambda function locally:

```bash
make test_local
```
