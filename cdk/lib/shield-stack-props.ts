import {EnvProps} from "./env-props";
import {aws_elasticloadbalancingv2} from "aws-cdk-lib";

export interface ShieldStackProps extends EnvProps {
    bannedIpListParameterName: string,
    whitelistedIpListParameterName: string,
    managedRulesParameterName: string,
    loadBalancer: aws_elasticloadbalancingv2.ApplicationLoadBalancer
}