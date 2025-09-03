import {
    aws_cloudwatch,
    aws_route53,
    aws_shield,
    aws_ssm,
    aws_wafv2,
    CfnParameter,
    Stack,
    StackProps, Token
} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ShieldStackProps} from "./shield-stack-props";

import { z } from "zod";

export class ShieldStack extends Stack {
    constructor(scope: Construct, id: string, props: ShieldStackProps) {
        super(scope, id, props);

        const banned_ips = new CfnParameter(this, 'bannedIpsList', {
            type: 'AWS::SSM::Parameter::Value<List<String>>',
            default: props.bannedIpListParameterName
        })

        const cfnBannedIPSet = new aws_wafv2.CfnIPSet(this, 'BannedIPSet', {
            name: 'banned-ips',
            scope: 'REGIONAL',
            ipAddressVersion: "IPV4",
            addresses: banned_ips.valueAsList
        })

        const whitelisted_ips = new CfnParameter(this, 'whitelistedIpsList', {
            type: 'AWS::SSM::Parameter::Value<List<String>>',
            default: props.whitelistedIpListParameterName
        })

        const cfnWhiteListedIpSet = new aws_wafv2.CfnIPSet(this, 'WhitelistedIPSet', {
            name: 'whitelisted-ips',
            scope: 'REGIONAL',
            ipAddressVersion: "IPV4",
            addresses: whitelisted_ips.valueAsList
        })




        let rules: aws_wafv2.CfnWebACL.RuleProperty[] = [
            {
                name: 'block-banned_ips',
                priority: 0,
                action: {
                    block: {}
                },
                statement: {
                    ipSetReferenceStatement: {
                        arn: cfnBannedIPSet.attrArn
                    }
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: "banned-ips",
                    sampledRequestsEnabled: false
                }
            },
            {
                name: 'allow-whitelisted_ips',
                priority: 1,
                action: {
                    allow:{}
                },
                statement: {
                    ipSetReferenceStatement: {
                        arn: cfnWhiteListedIpSet.attrArn
                    }
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: "whitelisted-ips",
                    sampledRequestsEnabled: false
                }
            }
        ]

        if ( props.limitASNs ) {
            const rate_limited_ASN_1 = aws_ssm.StringParameter.fromStringParameterAttributes(this,
                'rateLimitASN1', {
                    parameterName: props.rateLimitASN1ParameterName,
                    simpleName: false
                })

            const limitASNRule: aws_wafv2.CfnWebACL.RuleProperty = {
                name: 'rate-limited-ASNs',
                priority: 2,
                action: {
                    block: {}
                },
                statement: {
                    rateBasedStatement: {
                        limit: 10,
                        aggregateKeyType: "CONSTANT",
                        evaluationWindowSec: 60,
                        scopeDownStatement: {
                            asnMatchStatement: {
                                asnList: [Token.asNumber(rate_limited_ASN_1.stringValue)]
                            }
                        }
                    }
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: "rate-limited-ASNs",
                    sampledRequestsEnabled: false
                }
            }

            rules.push(limitASNRule)
        }


        const RuleGroupSchema = z.array(
            z.object(
                {
                    groupName: z.string(),
                    vendorName: z.string(),
                    ruleActionOverrideCounts: z.array(z.string()).default([]),
                    ruleActionOverrideBlocks: z.array(z.string()).default([])
                }
            ).strict()
        )

        const managedRulesParameter = aws_ssm.StringParameter.valueFromLookup(this, props.managedRulesParameterName)
        const managedRules = managedRulesParameter.startsWith("dummy-value") ? "dummy" : JSON.parse(managedRulesParameter)

        if ( managedRules !== "dummy"){
            let ruleList: any[] = []
            const validatedRules = RuleGroupSchema.parse(managedRules)
            validatedRules.forEach((rule, index: number) => {

                let ruleActionOverrides = []

                for (let overrideCountRule of rule.ruleActionOverrideCounts) {
                    let overrideCountRuleObj = {
                        actionToUse: {
                            count: {}
                        },
                        name: overrideCountRule
                    }

                    ruleActionOverrides.push(overrideCountRuleObj)
                }

                for (let overrideBlockRule of rule.ruleActionOverrideBlocks) {
                    let overrideBlockRuleObj = {
                        actionToUse: {
                            block: {}
                        },
                        name: overrideBlockRule
                    }

                    ruleActionOverrides.push(overrideBlockRuleObj)
                }

                let managedRuleGroup: aws_wafv2.CfnWebACL.RuleProperty = {
                    name: "managed-rule-group-" + rule.groupName,
                    priority: rules.length + index,
                    overrideAction: {
                        none: {}
                    },
                    statement: {
                        managedRuleGroupStatement: {
                            name: rule.groupName,
                            vendorName: rule.vendorName,
                            ruleActionOverrides: ruleActionOverrides
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: "request-managed-rule-group-" + rule.groupName,
                        sampledRequestsEnabled: true
                    }
                }


                ruleList.push(managedRuleGroup)
            })
            rules = rules.concat(ruleList)
        }



        const cfnWebAcl = new aws_wafv2.CfnWebACL(this, 'WAFWebACL', {
            scope: "REGIONAL",
            defaultAction: {
                allow: {}
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: "SixodpWAF",
                sampledRequestsEnabled: false
            },
            rules: rules
        })

        new aws_wafv2.CfnWebACLAssociation(this, 'WafAssociation', {
            resourceArn: props.loadBalancer.loadBalancerArn,
            webAclArn: cfnWebAcl.attrArn
        })

    }
}