import * as cdk from '@aws-cdk/core';
import * as remoteStack from 'cdk-remote-stack';
import { FargateAlbService, GlobalAcceleratorProvider, Route53Provider } from './ga-fargate-service-stack';

export class Main {
  readonly stack: cdk.Stack[] = [];
  readonly app: cdk.App;
  constructor() {

    const app = new cdk.App();

    const envJP = {
      region: 'ap-northeast-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    };

    const envUS = {
      region: 'us-west-2',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    };

    // fargate from JP
    const fargateJP = new cdk.Stack(app, 'FargateJPStack', { env: envJP });
    new FargateAlbService(fargateJP, 'FargateJPService');

    // fargate from US
    const fargateUS = new cdk.Stack(app, 'FargateUSStack', { env: envUS });
    new FargateAlbService(fargateUS, 'FargasteUSService');

    // Global Accelerator
    const gaStack = new cdk.Stack(app, 'GAStack', { env: envUS });
    const ga = new GlobalAcceleratorProvider(gaStack, 'GlobalAcceleratorProvider');

    // cross-regional stack outputs from JP
    const JPOutputs = new remoteStack.StackOutputs(gaStack, 'JPOutputs', {
      stack: fargateJP,
      alwaysUpdate: false,
    });
    const JPLoadBalancerDnsName = JPOutputs.getAttString('DnsName');
    const JPLoadBalancerArn = JPOutputs.getAttString('LoadBalancerArn');

    // cross-regional stack outputs from US
    const USOutputs = new remoteStack.StackOutputs(gaStack, 'USOutputs', {
      stack: fargateUS,
      alwaysUpdate: false,
    });
    const USLoadBalancerDnsName = USOutputs.getAttString('DnsName');
    const USLoadBalancerArn = USOutputs.getAttString('LoadBalancerArn');

    // ensure the dependency
    gaStack.addDependency(fargateJP);
    gaStack.addDependency(fargateUS);

    ga.endpointgroups['us-west-2'].addEndpoint('UsEndpoint', USLoadBalancerArn);
    ga.endpointgroups['ap-northeast-1'].addEndpoint('JpEndpoint', JPLoadBalancerArn);

    new cdk.CfnOutput(gaStack, 'GADnsName', { value: ga.dnsName });

    /**
     * create a Route53 CNAME records
     * 1. ga.demo.pahud.net => GA DNS NAME
     * 2. us-west-2.demo.pahud.net => US ALB
     * 3. ap-northeast-1.demo.pahud.net => JP ALB
     * 4. print the 3 endpoint URLs
     */
    new Route53Provider(gaStack, 'Route53AcmProvider', {
      globalAcceleratorDnsName: ga.dnsName,
      regionalCname: {
        'us-west-2': USLoadBalancerDnsName,
        'ap-northeast-1': JPLoadBalancerDnsName,
      },
    });

    this.stack.push(fargateJP, fargateUS, gaStack);
    this.app = app;
  }
}

new Main();
