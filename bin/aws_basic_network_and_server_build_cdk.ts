#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsBasicNetworkAndServerBuildCdkStack } from '../lib/aws_basic_network_and_server_build_cdk-stack';

const app = new cdk.App();
new AwsBasicNetworkAndServerBuildCdkStack(app, 'AwsBasicNetworkAndServerBuildCdkStack');
