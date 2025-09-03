import {aws_ssm, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {EnvProps} from "./env-props";

export class ShieldParameterStack extends Stack {
    readonly bannedIpListParameterName: string;
    readonly whitelistedIpListParameterName: string;
    readonly managedRulesParameterName: string;
    readonly rateLimitedASN1ParameterName: string;

    constructor(scope: Construct, id: string, props: EnvProps) {
        super(scope, id, props);

        this.bannedIpListParameterName = `/${props.environment}/waf/banned_ips`
        new aws_ssm.StringListParameter(this, 'bannedIplist', {
            stringListValue: ["127.0.0.1"],
            description: 'List of banned IP addresses',
            parameterName: this.bannedIpListParameterName
        })

        this.whitelistedIpListParameterName = `/${props.environment}/waf/whitelisted_ips`
        new aws_ssm.StringListParameter(this, 'whitelistedIplist', {
            stringListValue: ["127.0.0.1"],
            description: 'List of whitelisted IP addresses',
            parameterName: this.whitelistedIpListParameterName
        })

        this.managedRulesParameterName = `/${props.environment}/waf/managed_rules`
        new aws_ssm.StringParameter(this, 'managedRules', {
            stringValue: 'some placeholder',
            description: 'JSON value for managed rules',
            parameterName: this.managedRulesParameterName
        })

        this.rateLimitedASN1ParameterName = `/${props.environment}/waf/rate_limit_ASN_1`
        new aws_ssm.StringParameter(this, 'rateLimitASNList', {
            stringValue: "some placeholder",
            description: "ASN under strict rate limit",
            parameterName: this.rateLimitedASN1ParameterName
        })
    }
}