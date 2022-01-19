#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StepfunctionManualSampleStack } from '../lib/stepfunction-manual-sample-stack';

const app = new cdk.App();
new StepfunctionManualSampleStack(app, 'sf-demo', {});