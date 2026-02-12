import {aws_ssm, Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import {EnvProps} from "./env-props";

export class ShieldParameterStack extends Stack {
    readonly bannedIpListParameterName: string;
    readonly whitelistedIpListParameterName: string;
    readonly managedRulesParameterName: string;
    readonly rateLimitedASNsParameterName: string;
    readonly rateLimitedCountriesParameterName: string;
    readonly whitelistedCountriesParameterName: string;

    constructor(scope: Construct, id: string, props: EnvProps) {
        super(scope, id, props);

        this.bannedIpListParameterName = `/${props.environment}/waf/banned_ips`
        new aws_ssm.StringListParameter(this, 'bannedIplist', {
            stringListValue: ["127.0.0.1/32"],
            description: 'List of banned IP addresses',
            parameterName: this.bannedIpListParameterName
        })

        this.whitelistedIpListParameterName = `/${props.environment}/waf/whitelisted_ips`
        new aws_ssm.StringListParameter(this, 'whitelistedIplist', {
            stringListValue: ["127.0.0.1/32"],
            description: 'List of whitelisted IP addresses',
            parameterName: this.whitelistedIpListParameterName
        })

        this.managedRulesParameterName = `/${props.environment}/waf/managed_rules`
        new aws_ssm.StringParameter(this, 'managedRules', {
            stringValue: 'some placeholder',
            description: 'JSON value for managed rules',
            parameterName: this.managedRulesParameterName
        })

        this.rateLimitedASNsParameterName = `/${props.environment}/waf/rate_limit_ASNs`
        new aws_ssm.StringParameter(this, 'rateLimitedASNs', {
            stringValue: '[]',
            description: 'ASNs as a list under heavy rate limit',
            parameterName: this.rateLimitedASNsParameterName
        })

        this.rateLimitedCountriesParameterName = `/${props.environment}/waf/rate_limit_countries`
        new aws_ssm.StringListParameter(this, 'rateLimitedCountries', {
            stringListValue: ['some placeholder'],
            description: 'Country codes under heavy rate limit',
            parameterName: this.rateLimitedCountriesParameterName
        })

        this.whitelistedCountriesParameterName = `/${props.environment}/waf/whitelisted_countries`
        new aws_ssm.StringListParameter(this, 'whitelistedCountries', {
            stringListValue: ['some placeholder'],
            description: 'Whitelisted country codes',
            parameterName: this.whitelistedCountriesParameterName
        })
    }
}