import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
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

    // コンソール画面から既に作成しているEC2のキーペア(my-key)を取得
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'my-key');

    // EC2 インスタンス(Web Server)の作成
    // Web Serverのセキュリティグループを作成
    const webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: vpc,
      securityGroupName: 'WEB-SG',
    });

    // Web Serverのセキュリティグループにインバウンドルールを追加
    webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from anywhere');
    webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic from anywhere');

    // Web Serverのインスタンスを作成
    const webServer = new ec2.Instance(this, 'WebServer', {
      instanceName: 'WEBサーバー',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webServerSecurityGroup,
      keyPair: keyPair,
    });

    // EC2 インスタンス(DB server)の作成
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

    // DB serverのインスタンスを作成
    const dbServer = new ec2.Instance(this, 'DBServer', {
      instanceName: 'DBサーバー',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: dbServerSecurityGroup,
      keyPair: keyPair,
    });
  }
}
