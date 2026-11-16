import { registerAs } from "@nestjs/config";

export default registerAs("changepay", () => ({
  baseUrl: (process.env.CHANGEPAY_BASE_URL || "").replace(/\/$/, ""),
  thirdPartyId: process.env.CHANGEPAY_THIRD_PARTY_ID || "",
  externalToken: process.env.CHANGEPAY_EXTERNAL_TOKEN || "",
  clusterId: process.env.CHANGEPAY_CLUSTER_ID || "",
  appName: process.env.CHANGEPAY_APP_NAME || "SuperCampus",
  defaultCustomerPhone: process.env.CHANGEPAY_DEFAULT_CUSTOMER_PHONE || "",
  enabled: Boolean(
    process.env.CHANGEPAY_BASE_URL &&
      process.env.CHANGEPAY_THIRD_PARTY_ID &&
      process.env.CHANGEPAY_EXTERNAL_TOKEN &&
      process.env.CHANGEPAY_CLUSTER_ID,
  ),
}));
