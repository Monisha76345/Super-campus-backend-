import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { CreateFoodAddressReqDto, UpdateFoodAddressReqDto } from "../dto/request/create-address.req.dto";
import { CreateFoodOrderReqDto } from "../dto/request/create-food-order.req.dto";
import { UpdateFoodCartReqDto } from "../dto/request/update-cart.req.dto";
import { FoodService } from "../service/food.service";

@ApiTags("Food")
@ApiBearerAuth()
@Controller("food")
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get("status")
  @ApiOperation({ summary: "Whether ChangePay food ordering is configured" })
  status() {
    return ApiResponseDto.success(this.foodService.status(), "Food status");
  }

  @Get("businesses")
  @ApiOperation({ summary: "List campus food businesses from ChangePay" })
  async listBusinesses(
    @CurrentUser() user: JwtPayload,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const data = await this.foodService.listBusinesses(
      user.sub,
      search,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
    return ApiResponseDto.success(data, "Businesses retrieved");
  }

  @Get("businesses/:businessId")
  @ApiOperation({ summary: "Get food business details" })
  async getBusiness(@CurrentUser() user: JwtPayload, @Param("businessId") businessId: string) {
    const data = await this.foodService.getBusiness(user.sub, businessId);
    return ApiResponseDto.success(data, "Business retrieved");
  }

  @Get("businesses/:businessId/open")
  @ApiOperation({ summary: "Check if a food business is open" })
  async getBusinessOpen(@CurrentUser() user: JwtPayload, @Param("businessId") businessId: string) {
    const data = await this.foodService.getBusinessOpen(user.sub, businessId);
    return ApiResponseDto.success(data, "Open status retrieved");
  }

  @Get("businesses/:businessId/categories")
  @ApiOperation({ summary: "List menu categories" })
  async listCategories(@CurrentUser() user: JwtPayload, @Param("businessId") businessId: string) {
    const data = await this.foodService.listCategories(user.sub, businessId);
    return ApiResponseDto.success(data, "Categories retrieved");
  }

  @Get("businesses/:businessId/products")
  @ApiOperation({ summary: "List menu products / SKUs" })
  async listProducts(
    @CurrentUser() user: JwtPayload,
    @Param("businessId") businessId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("filter") filter?: string,
  ) {
    const data = await this.foodService.listProducts(
      user.sub,
      businessId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      filter,
    );
    return ApiResponseDto.success(data, "Products retrieved");
  }

  @Get("businesses/:businessId/categories/:categoryId/products")
  @ApiOperation({ summary: "List products in a category" })
  async listCategoryProducts(
    @CurrentUser() user: JwtPayload,
    @Param("businessId") businessId: string,
    @Param("categoryId", ParseIntPipe) categoryId: number,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const data = await this.foodService.listCategoryProducts(
      user.sub,
      businessId,
      categoryId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
    return ApiResponseDto.success(data, "Category products retrieved");
  }

  @Get("businesses/:businessId/products/:productId")
  @ApiOperation({ summary: "Get one product with SKUs" })
  async getProduct(
    @CurrentUser() user: JwtPayload,
    @Param("businessId") businessId: string,
    @Param("productId", ParseIntPipe) productId: number,
  ) {
    const data = await this.foodService.getProduct(user.sub, businessId, productId);
    return ApiResponseDto.success(data, "Product retrieved");
  }

  @Get("businesses/:businessId/skus/:skuId/addons")
  @ApiOperation({ summary: "List add-ons for a SKU" })
  async listSkuAddons(
    @CurrentUser() user: JwtPayload,
    @Param("businessId") businessId: string,
    @Param("skuId", ParseIntPipe) skuId: number,
  ) {
    const data = await this.foodService.listSkuAddons(user.sub, businessId, skuId);
    return ApiResponseDto.success(data, "Add-ons retrieved");
  }

  @Get("addresses")
  @ApiOperation({ summary: "List ChangePay delivery addresses for this student" })
  async listAddresses(@CurrentUser() user: JwtPayload) {
    const data = await this.foodService.listAddresses(user.sub);
    return ApiResponseDto.success(data, "Addresses retrieved");
  }

  @Post("addresses")
  @ApiOperation({ summary: "Create a delivery address" })
  async createAddress(@CurrentUser() user: JwtPayload, @Body() body: CreateFoodAddressReqDto) {
    const data = await this.foodService.createAddress(user.sub, body);
    return ApiResponseDto.success(data, "Address created");
  }

  @Patch("addresses/:addressId")
  @ApiOperation({ summary: "Update a delivery address" })
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param("addressId") addressId: string,
    @Body() body: UpdateFoodAddressReqDto,
  ) {
    const data = await this.foodService.updateAddress(user.sub, addressId, body);
    return ApiResponseDto.success(data, "Address updated");
  }

  @Delete("addresses/:addressId")
  @ApiOperation({ summary: "Delete a delivery address" })
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param("addressId") addressId: string) {
    await this.foodService.deleteAddress(user.sub, addressId);
    return ApiResponseDto.success(null, "Address deleted");
  }

  @Put("cart")
  @ApiOperation({ summary: "Create or replace the ChangePay cart and get priced totals" })
  async updateCart(@CurrentUser() user: JwtPayload, @Body() body: UpdateFoodCartReqDto) {
    const data = await this.foodService.updateCart(user.sub, body);
    return ApiResponseDto.success(data, "Cart updated");
  }

  @Get("cart")
  @ApiOperation({ summary: "Read the current cart" })
  async getCart(@CurrentUser() user: JwtPayload) {
    const data = await this.foodService.getCart(user.sub);
    return ApiResponseDto.success(data, "Cart retrieved");
  }

  @Delete("cart")
  @ApiOperation({ summary: "Clear the current cart" })
  async clearCart(@CurrentUser() user: JwtPayload) {
    await this.foodService.clearCart(user.sub);
    return ApiResponseDto.success(null, "Cart cleared");
  }

  @Post("orders")
  @ApiOperation({ summary: "Place a food order" })
  async createOrder(@CurrentUser() user: JwtPayload, @Body() body: CreateFoodOrderReqDto) {
    const data = await this.foodService.createOrder(user.sub, body);
    return ApiResponseDto.success(data, "Order created");
  }

  @Get("orders")
  @ApiOperation({ summary: "List food orders for this student" })
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const data = await this.foodService.listOrders(
      user.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
    return ApiResponseDto.success(data, "Orders retrieved");
  }

  @Get("orders/:orderId")
  @ApiOperation({ summary: "Get food order detail and payment status" })
  async getOrder(@CurrentUser() user: JwtPayload, @Param("orderId") orderId: string) {
    const data = await this.foodService.getOrder(user.sub, orderId);
    return ApiResponseDto.success(data, "Order retrieved");
  }

  @Get("orders/:orderId/razorpay")
  @ApiOperation({ summary: "Get or create Razorpay checkout params" })
  async getRazorpay(@CurrentUser() user: JwtPayload, @Param("orderId") orderId: string) {
    const data = await this.foodService.getRazorpayParams(user.sub, orderId);
    return ApiResponseDto.success(data, "Razorpay params retrieved");
  }

  @Post("orders/:orderId/payment")
  @ApiOperation({ summary: "Claim COD payment for an unpaid order" })
  async claimCod(@CurrentUser() user: JwtPayload, @Param("orderId") orderId: string) {
    const data = await this.foodService.claimCodPayment(user.sub, orderId);
    return ApiResponseDto.success(data, "COD payment claimed");
  }

  @Post("orders/:orderId/cancel-checkout")
  @ApiOperation({ summary: "Abandon an unpaid CUSTOMER_PENDING checkout" })
  async cancelCheckout(@CurrentUser() user: JwtPayload, @Param("orderId") orderId: string) {
    const data = await this.foodService.cancelCheckout(user.sub, orderId);
    return ApiResponseDto.success(data, "Checkout cancelled");
  }
}
