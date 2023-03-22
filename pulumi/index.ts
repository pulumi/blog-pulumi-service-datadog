import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const pulumiOrg = new pulumi.Config().get("pulumiOrg") || pulumi.getStack().split('/')[0];
const accessToken = new pulumi.Config().getSecret("pulumiAccessToken") || process.env.PULUMI_ACCESS_TOKEN;

const datadogApiKey = process.env.DD_API_KEY;
if (!datadogApiKey) {
  throw new Error("DD_API_KEY must be set");
}

const datadogAppKey = process.env.DD_APP_KEY;
if (!datadogAppKey) {
  throw new Error("DD_APP_KEY must be set");
}

const lambdaName = "scrape-pulumi-service-metrics";

const createSecret = (name: string, value: pulumi.Input<string>) => {
  const pulumiAccessTokenSecret = new aws.secretsmanager.Secret(`${name}`, {
    name: `${lambdaName}/${name}`,
    recoveryWindowInDays: 0,
  });

  new aws.secretsmanager.SecretVersion(`${name}-version`, {
    secretId: pulumiAccessTokenSecret.id,
    secretString: value,
  });
};

createSecret("pulumi-access-token", accessToken!);
createSecret("datadog-api-key", datadogApiKey);
createSecret("datadog-app-key", datadogAppKey);

const role = new aws.iam.Role("lambda-role", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",
      },
    ],
  },
});

new aws.iam.RolePolicyAttachment("lambda-role-attachment", {
  role: role.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

const secretsPolicy = new aws.iam.Policy("allow-lambda-secrets", {
  namePrefix: `${lambdaName}-all-read-secrets`,
  policy: {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": [
          `arn:aws:secretsmanager:*:*:secret:${lambdaName}/*`
        ]
      }
    ]
  }
});

new aws.iam.RolePolicyAttachment("lambda-secrets-attachment", {
  role: role.name,
  policyArn: secretsPolicy.arn,
});

const lambdaFunc = new aws.lambda.Function(lambdaName, {
  code: new pulumi.asset.FileArchive("../lambda"),
  runtime: aws.lambda.NodeJS12dXRuntime,
  role: role.arn,
  handler: "index.handler",
  environment: {
    variables: {
      PULUMI_ORG: pulumiOrg
    }
  }
});

export const lambdaFuncName = lambdaFunc.name;