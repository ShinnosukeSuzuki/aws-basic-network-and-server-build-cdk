import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// ec2 に関するパッケージを import
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class AwsBasicNetworkAndServerBuildCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC の作成
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: 'VPC',
      maxAzs: 1,
      createInternetGateway: true,
      natGateways: 1,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),

      // サブネットの設定
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'パブリックサブネット',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'プライベートサブネット',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
