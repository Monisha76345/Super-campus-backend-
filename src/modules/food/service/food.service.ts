import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { RedisService } from "src/core/redis/redis.service";
import { UserService } from "src/modules/user/service/user.service";
import { CreateFoodAddressReqDto, UpdateFoodAddressReqDto } from "../dto/request/create-address.req.dto";
import { CreateFoodOrderReqDto } from "../dto/request/create-food-order.req.dto";
import { UpdateFoodCartReqDto } from "../dto/request/update-cart.req.dto";
import { ChangePayClientService } from "./changepay-client.service";

const VENDOR_JWT_TTL_SECONDS = 6 * 60 * 60;

interface ExternalLoginResponse {
  token?: string;
  access_token?: string;
  jwt?: string;
  data?: {
    token?: string;
    access_token?: string;
    jwt?: string;
    profile_name?: string;
  };
}

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(
    private readonly changepay: ChangePayClientService,
    private readonly users: UserService,
    private readonly redis: RedisService,
    private readonly tenantContext: TenantContextService,
  ) {}

  status() {
    return {
      enabled: this.changepay.isConfigured(),
      clusterId: this.changepay.isConfigured() ? this.changepay.clusterId : null,
    };
  }

  async listBusinesses(userId: string, searchQuery?: string, page = 1, pageSize = 20) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: "/api/v1/businesses/",
      vendorJwt,
      query: {
        cluster_id: this.changepay.clusterId,
        search_query: searchQuery,
        page,
        page_size: Math.min(pageSize, 100),
      },
    });
  }

  async getBusiness(userId: string, businessId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}`,
      vendorJwt,
    });
  }

  async getBusinessOpen(userId: string, businessId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/open`,
      vendorJwt,
    });
  }

  async listCategories(userId: string, businessId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/catalog/categories`,
      vendorJwt,
    });
  }

  async listProducts(userId: string, businessId: string, page = 1, pageSize = 20, filter?: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/catalog/products`,
      vendorJwt,
      query: {
        page,
        page_size: Math.min(pageSize, 100),
        filter,
        in_stock: true,
      },
    });
  }

  async listCategoryProducts(
    userId: string,
    businessId: string,
    categoryId: number,
    page = 1,
    pageSize = 20,
  ) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/catalog/categories/${categoryId}/products`,
      vendorJwt,
      query: {
        page,
        page_size: Math.min(pageSize, 100),
      },
    });
  }

  async getProduct(userId: string, businessId: string, productId: number) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/catalog/products/${productId}`,
      vendorJwt,
    });
  }

  async listSkuAddons(userId: string, businessId: string, skuId: number, page = 1) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/businesses/${businessId}/catalog/skus/${skuId}/addons_list`,
      vendorJwt,
      query: { page, page_size: 50 },
    });
  }

  async listAddresses(userId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: "/api/v1/addresses/",
      vendorJwt,
    });
  }

  async createAddress(userId: string, body: CreateFoodAddressReqDto) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "POST",
      path: "/api/v1/addresses/",
      vendorJwt,
      body,
    });
  }

  async updateAddress(userId: string, addressId: string, body: UpdateFoodAddressReqDto) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "PATCH",
      path: `/api/v1/addresses/${addressId}`,
      vendorJwt,
      body,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "DELETE",
      path: `/api/v1/addresses/${addressId}`,
      vendorJwt,
    });
  }

  async updateCart(userId: string, body: UpdateFoodCartReqDto) {
    if (body.delivery_type === "DA_DELIVERY" && !body.delivery_address_id) {
      throw new BadRequestException("delivery_address_id is required for delivery orders");
    }
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "PUT",
      path: "/api/v1/orders/cart",
      vendorJwt,
      body: {
        business_id: body.business_id,
        order_type: "PRODUCT",
        delivery_type: body.delivery_type,
        order_items: body.order_items,
        delivery_address_id: body.delivery_address_id,
        customer_note: body.customer_note,
      },
    });
  }

  async getCart(userId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: "/api/v1/orders/cart",
      vendorJwt,
    });
  }

  async clearCart(userId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "DELETE",
      path: "/api/v1/orders/cart",
      vendorJwt,
    });
  }

  async createOrder(userId: string, body: CreateFoodOrderReqDto) {
    if (body.delivery_type === "DA_DELIVERY" && !body.delivery_address_id) {
      throw new BadRequestException("delivery_address_id is required for delivery orders");
    }
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "POST",
      path: "/api/v1/orders/",
      vendorJwt,
      appName: true,
      body: {
        business_id: body.business_id,
        checkout_id: body.checkout_id,
        order_type: "PRODUCT",
        delivery_type: body.delivery_type,
        payment_type: body.payment_type,
        order_items: body.order_items,
        delivery_address_id: body.delivery_address_id,
        customer_note: body.customer_note,
        promo_code: body.promo_code,
        table_number: body.table_number,
      },
    });
  }

  async getOrder(userId: string, orderId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/orders/${orderId}`,
      vendorJwt,
    });
  }

  async listOrders(userId: string, page = 1, pageSize = 10) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: "/api/v1/orders/",
      vendorJwt,
      query: {
        page,
        page_size: Math.min(pageSize, 100),
      },
    });
  }

  async getRazorpayParams(userId: string, orderId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      path: `/api/v1/orders/${orderId}/razorpay`,
      vendorJwt,
    });
  }

  async claimCodPayment(userId: string, orderId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "POST",
      path: `/api/v1/orders/${orderId}/payment`,
      vendorJwt,
    });
  }

  async cancelCheckout(userId: string, orderId: string) {
    const vendorJwt = await this.vendorJwt(userId);
    return this.changepay.request({
      method: "POST",
      path: `/api/v1/orders/${orderId}/cancel`,
      vendorJwt,
      body: { checkout: true },
    });
  }

  private async vendorJwt(userId: string): Promise<string> {
    this.changepay.requireConfigured();
    const tenantId = this.tenantContext.getTenantId();
    const cacheKey = `changepay:vendor-jwt:${tenantId}:${userId}`;
    const cached = await this.redis.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const contact = await this.users.getFoodCustomerContact(userId);
    const response = await this.changepay.request<ExternalLoginResponse>({
      method: "POST",
      path: "/api/v1/auth/external/customer",
      body: {
        phone: contact.phone,
        third_party_id: this.changepay.thirdPartyId,
        external_token: this.changepay.externalToken,
        profile_name: contact.profileName,
      },
    });

    const token = [
      response?.token,
      response?.access_token,
      response?.jwt,
      response?.data?.token,
      response?.data?.access_token,
      response?.data?.jwt,
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find(Boolean);
    if (!token) {
      this.logger.error(`ChangePay external login returned no token for user ${userId}`);
      throw new BadRequestException("Unable to start food ordering session");
    }

    await this.redis.set(cacheKey, token, VENDOR_JWT_TTL_SECONDS);
    return token;
  }
}
