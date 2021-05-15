const { Automation } = require('projen-automate-it');
const { AwsCdkTypeScriptApp } = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.77.0',
  name: 'fargate-global',
  authorName: 'Pahud Hsieh',
  authorEmail: 'pahudnet@gmail.com',
  repository: 'https://github.com/pahud/fargate-global.git',
  dependabot: false,
  cdkDependencies: [
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-globalaccelerator',
    '@aws-cdk/aws-globalaccelerator-endpoints',
    '@aws-cdk/aws-elasticloadbalancingv2',
    '@aws-cdk/aws-route53',
    '@aws-cdk/aws-route53-patterns',
    '@aws-cdk/aws-route53-targets',
    '@aws-cdk/core',
  ],
  deps: ['cdk-remote-stack', 'projen-automate-it'],
  defaultReleaseBranch: ['main'],
});


const automation = new Automation(project, {
  automationToken: AUTOMATION_TOKEN,
});
automation.autoApprove();
automation.autoMerge();
automation.projenYarnUpgrade();


const common_exclude = ['cdk.context.json', 'docker-compose.yml', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
