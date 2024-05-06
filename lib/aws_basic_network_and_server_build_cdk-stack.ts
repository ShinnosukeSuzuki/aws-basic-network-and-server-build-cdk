import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
// ec2 に関するパッケージを import
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// 自作コンストラクトを import
import { EC2ServerInstance } from './constructs/ec2-server-instance';

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

    // キーペア作成
    const cfnKeyPair = new ec2.CfnKeyPair(this, 'CfnKeyPair', {
      keyName: 'key-pair-by-cdk',
    })
    cfnKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY)

    // キーペア取得コマンドアウトプット
    new CfnOutput(this, 'GetSSHKeyCommand', {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnKeyPair.getAtt('KeyPairId')} --region ${this.region} --with-decryption --query Parameter.Value --output text`,
    })

    // Web Serverのセキュリティグループを作成
    const webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: vpc,
      securityGroupName: 'WEB-SG',
    });

    // Web Serverのセキュリティグループにインバウンドルールを追加
    webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from anywhere');
    webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic from anywhere');

    // DB serverのセキュリティグループを作成
    const dbServerSecurityGroup = new ec2.SecurityGroup(this, 'DBServerSecurityGroup', {
      vpc: vpc,
      securityGroupName: 'DB-SG',
    });

    // DB serverのセキュリティグループにインバウンドルールを追加
    // MariaDB(MySQL)のポートを開放(Web Serverからのアクセスのみを許可)
    dbServerSecurityGroup.addIngressRule(webServerSecurityGroup, ec2.Port.tcp(3306), 'Allow MySQL traffic from Web Server');
    // SSHのポートを開放(Web Serverからのアクセスのみを許可)
    dbServerSecurityGroup.addIngressRule(webServerSecurityGroup, ec2.Port.tcp(22), 'Allow SSH traffic from Web Server');
    // ICMPのポートを開放(Web Serverからのアクセスのみを許可)
    dbServerSecurityGroup.addIngressRule(webServerSecurityGroup, ec2.Port.icmpPing(), 'Allow ICMP traffic from Web Server');

    
    // Web Serverのインスタンスを作成
    new EC2ServerInstance(this, 'WebServer', {
      vpc: vpc,
      instanceName: 'WEBサーバー',
      subnetType: ec2.SubnetType.PUBLIC,
      securityGroup: webServerSecurityGroup,
      keyName: cfnKeyPair.keyName,
    });

    // DB serverのインスタンスを作成
    new EC2ServerInstance(this, 'DBServer', {
      vpc: vpc,
      instanceName: 'DBサーバー',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      securityGroup: dbServerSecurityGroup,
      keyName: cfnKeyPair.keyName,
    });
  }
}
