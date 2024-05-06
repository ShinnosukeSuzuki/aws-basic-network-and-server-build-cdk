import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// Construct props を定義
export interface EC2ServerInstanceProps {
  readonly vpc: ec2.IVpc
  readonly instanceName: string
  readonly subnetType: ec2.SubnetType
  readonly securityGroup: ec2.ISecurityGroup
  readonly keyName: string
}

// EC2 インスタンスを含む Construct を定義
export class EC2ServerInstance extends Construct {
  // 外部からインスタンスへアクセスできるように設定
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: EC2ServerInstanceProps) {
    super(scope, id);

    // Construct props から vpc, instanceName, subnetType, securityGroup, keyName を取り出す
    const { vpc, instanceName, subnetType, securityGroup, keyName } = props;

    const instance = new ec2.Instance(this, "Instance", {
      instanceName,
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: { subnetType },
      securityGroup,
      keyName,
    });

    // 作成した EC2 インスタンスをプロパティに設定
    this.instance = instance;
  }
}
