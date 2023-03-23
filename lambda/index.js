import axios from 'axios';
import { client, v2 } from '@datadog/datadog-api-client';
import * as secretsManager from '@aws-sdk/client-secrets-manager';

const handler = async (event) => {
  const pulumiAccessToken = await getSecret('pulumi-access-token');
  const ddApiKey = await getSecret('datadog-api-key');
  const ddAppKey = await getSecret('datadog-app-key');

  const pulumiOrg = process.env.PULUMI_ORG;
  if (!pulumiOrg) {
    throw new Error('PULUMI_ORG environment variable not set');
  }

  await handlerInternal(event, pulumiAccessToken, ddApiKey, ddAppKey, pulumiOrg)
  return "OK";
}

const handlerInternal  = async(event, pulumiAccessToken, ddApiKey, ddAppKey, pulumiOrg) => {
  const serviceMetrics = await getPulumiMetrics(pulumiOrg, pulumiAccessToken);
  const response = await sendMetricsToDatadog(serviceMetrics.summary, ddApiKey, ddAppKey);
  console.log(`response = ${JSON.stringify(response)}`);

  return event;
};

async function getPulumiMetrics(organization, pulumiToken) {
  const response = await axios.get(`https://api.pulumi.com/api/orgs/${organization}/resources/summary?granularity=monthly&lookbackDays=730`, {
    headers: {
      authorization: `token ${pulumiToken}`
    }
  });
  return response.data;
}

async function sendMetricsToDatadog(metrics, ddApiKey, ddAppKey) {
  const configuration = client.createConfiguration({
    authMethods: {
      apiKeyAuth: ddApiKey,
      appKeyAuth: ddAppKey
    }
  });
  const metricsApi = new v2.MetricsApi(configuration);
    
  const series = metrics.map(metric => ({
    metric: `joshtestmetric`,
    points: [[Date.now() / 1000, metric.value]],
    tags: ['test:joshtest']
  }));

  const request = {
    body: {
      series
    }
  };

  return await metricsApi.submitMetrics(request);
}

async function getSecret(secretName) {
  const client = new secretsManager.SecretsManagerClient();
  const command = new secretsManager.GetSecretValueCommand({ SecretId: `scrape-pulumi-service-metrics/${secretName}`});
  const response = await client.send(command);

  if (!response.SecretString) {
    throw(new Error(`Secret ${secretName} not found`));
  }

  return response.SecretString;
}

export {handler, handlerInternal}