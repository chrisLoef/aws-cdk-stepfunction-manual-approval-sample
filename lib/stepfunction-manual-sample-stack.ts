import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sf from 'aws-cdk-lib/aws-stepfunctions';
import * as sfTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Effect } from 'aws-cdk-lib/aws-iam';


export class StepfunctionManualSampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. Create Activity
    const manualStepActivity = new sf.Activity(this, 'manualStep', {
      activityName: 'ManualStep',
    });

    // 2. Create State Machine
    const manualStepState = new sfTasks.StepFunctionsInvokeActivity(this, 'manualApproval', {
      activity: manualStepActivity,
      timeout: Duration.seconds(3600),
    });
    const workflow = sf.Chain.start(manualStepState);
    const stepFunction = new sf.StateMachine(this, 'promotion-flow', {
      definition: workflow,
      tracingEnabled: true,
    });
    // 3. Create API
    const api = new apigw.RestApi(this, 'api', {});
    const apiRole = new iam.Role(this, 'apigwRole', {
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess'),
      ],
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    const failResource = api.root.addResource('fail');
    const failIntegration = new apigw.AwsIntegration({
      service: 'states',
      action: 'SendTaskFailure',
      integrationHttpMethod: 'POST',
      region: props?.env?.region,
      options: {
        credentialsRole: apiRole,
        requestTemplates: {
          'application/json': JSON.stringify({
            cause: "Reject link was clicked.", error: "Rejected", taskToken: "$input.params('taskToken')"
          }),
        },
      },
    });
    failResource.addMethod('GET', failIntegration, {});

    const succeedResource = api.root.addResource('succeed');
    const succeedIntegration = new apigw.AwsIntegration({
      service: 'states',
      action: 'SendTaskSuccess',
      integrationHttpMethod: 'POST',
      region: this.region,
      options: {
        credentialsRole: apiRole,
        requestTemplates: {
          'application/json': JSON.stringify({
            output: "\"Approve link was clicked.\"", taskToken: "$input.params('taskToken')"
          }),
        },
      },
    });
    succeedResource.addMethod('GET', succeedIntegration, {});

    // 4. Activity Worker
    const pollerFunction = new lambda.Function(this, 'pollerFunction', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./pollerFunction'),
      environment: {
        API_DEPLOYMENT_ID: api.restApiId,
        ACCOUNT_ID: this.account,
        REGION: this.region,
        ACTIVITY_ARN: manualStepActivity.activityArn,
      },
      timeout: Duration.seconds(60),
    });

    const rule = new events.Rule(this, 'rule', {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      enabled: true,
    });
    rule.addTarget(new targets.LambdaFunction(pollerFunction, {}));
    // 5. Test that the process works
    pollerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'states:GetActivityTask'
      ],
      effect: Effect.ALLOW,
      resources: [manualStepActivity.activityArn],
    }));
    pollerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ses:SendEmail'
      ],
      effect: Effect.ALLOW,
      resources: ['*'],
    }));
  }
}
