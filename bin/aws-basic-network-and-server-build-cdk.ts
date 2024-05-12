#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsBasicNetworkAndServerBuildCdkStack } from '../lib/aws-basic-network-and-server-build-cdk-stack';

const app = new cdk.App();
new AwsBasicNetworkAndServerBuildCdkStack(app, 'AwsBasicNetworkAndServerBuildCdkStack');

// stackに対してタグを設定
cdk.Tags.of(app).add('StackName', 'AwsBasicNetworkAndServerBuildCdkStack');
