# AWS Step Functions Manual Approval Example

This is a Project in CDK that aligns to an old AWS Blog Post regarding the Usage of an manual approval integration through an Activity in AWS Step Functions (Article: https://aws.amazon.com/de/blogs/compute/implementing-serverless-manual-approval-steps-in-aws-step-functions-and-amazon-api-gateway/)

There's also another CloudFormation Template that should fully work by AWS. I didn't tested it and found it after i set up everything.
- https://docs.aws.amazon.com/step-functions/latest/dg/tutorial-human-approval.html#human-approval-deploy

# Prerequisites
- Install node + npm
- Install CDK CLI
- do `npm install` after copying data
- go to ses in the region where you want to deploy it and verify your email address for testing (as this is a sandbox account it's not possible to send emails to anyone. You also need to verify the received email)

# Deployment
- `npm install`
- go to `./pollerFunction` directory type `tsc index.ts``
- if first time using cdk => `cdk bootstrap`
- go back to root and do `cdk deploy` and take care of instructions from CDK

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
