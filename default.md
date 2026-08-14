# 仿京东商城 - 后端接口文档


**简介**:仿京东商城 - 后端接口文档


**HOST**:http://localhost:8080


**联系人**:ngsz


**Version**:1.0.0


**接口路径**:/v3/api-docs/default


[TOC]






# 07. 收藏


## 添加收藏


**接口地址**:`/api/favorites/{productId}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>收藏指定商品（已收藏则忽略）</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|productId|商品 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 取消收藏


**接口地址**:`/api/favorites/{productId}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>取消对指定商品的收藏</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|productId|商品 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 我的收藏列表


**接口地址**:`/api/favorites`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前用户收藏的所有商品</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 是否已收藏


**接口地址**:`/api/favorites/check/{productId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>用于商品详情页爱心按钮的初始状态</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|productId|商品 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 12. 管理员-优惠券


## 查询可发放的优惠券


**接口地址**:`/api/admin/coupons/available`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>管理员视角查询所有可用的优惠券模板（不分店铺）</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 04. 购物车


## 勾选-取消勾选购物车条目


**接口地址**:`/api/cart/{id}/selected`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>用于结算前勾选要购买的商品</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|购物车条目 ID|path|true|integer(int64)||
|selected|1 勾选，0 取消|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 修改购物车数量


**接口地址**:`/api/cart/{id}/quantity`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>修改某条购物车记录的购买数量</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|购物车条目 ID|path|true|integer(int64)||
|quantity|新的购买数量|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 全选-全不选购物车


**接口地址**:`/api/cart/select-all`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>一键切换当前用户购物车所有条目的勾选状态</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|selected|1 全选，0 全不选|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询我的购物车


**接口地址**:`/api/cart`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前登录用户购物车中的所有条目</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 加入购物车


**接口地址**:`/api/cart`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>将指定 SKU 加入购物车，若已存在则数量累加</p>



**请求示例**:


```javascript
{
  "skuId": 10,
  "quantity": 1
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|cartDTO|加入购物车请求参数|body|true|CartDTO|CartDTO|
|&emsp;&emsp;skuId|要加入购物车的 SKU ID||true|integer(int64)||
|&emsp;&emsp;quantity|购买数量||true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 删除购物车条目


**接口地址**:`/api/cart/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>从购物车中移除某条记录</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|购物车条目 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 19. 商家-店铺


## 查询我的店铺


**接口地址**:`/api/merchant/shop`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前登录用户作为店主的店铺信息；未申请则返回 null</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 修改店铺信息


**接口地址**:`/api/merchant/shop`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>只能修改当前用户作为店主的店铺</p>



**请求示例**:


```javascript
{
  "id": 100,
  "userId": 10,
  "shopName": "华为官方旗舰店",
  "logo": "",
  "description": "",
  "licenseImage": "",
  "status": 1,
  "rating": 4.8,
  "createTime": "",
  "updateTime": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|shop|店铺|body|true|Shop|Shop|
|&emsp;&emsp;id|店铺 ID||false|integer(int64)||
|&emsp;&emsp;userId|店主用户 ID||false|integer(int64)||
|&emsp;&emsp;shopName|店铺名称||false|string||
|&emsp;&emsp;logo|店铺 Logo URL||false|string||
|&emsp;&emsp;description|店铺简介||false|string||
|&emsp;&emsp;licenseImage|营业执照图片 URL||false|string||
|&emsp;&emsp;status|店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝||false|integer(int32)||
|&emsp;&emsp;rating|店铺综合评分（0~5）||false|number||
|&emsp;&emsp;createTime|创建时间||false|string(date-time)||
|&emsp;&emsp;updateTime|更新时间||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 提交店铺入驻申请


**接口地址**:`/api/merchant/shop/apply`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>提交店铺信息和营业执照图片，状态变为待审核</p>



**请求示例**:


```javascript
{
  "id": 100,
  "userId": 10,
  "shopName": "华为官方旗舰店",
  "logo": "",
  "description": "",
  "licenseImage": "",
  "status": 1,
  "rating": 4.8,
  "createTime": "",
  "updateTime": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|shop|店铺|body|true|Shop|Shop|
|&emsp;&emsp;id|店铺 ID||false|integer(int64)||
|&emsp;&emsp;userId|店主用户 ID||false|integer(int64)||
|&emsp;&emsp;shopName|店铺名称||false|string||
|&emsp;&emsp;logo|店铺 Logo URL||false|string||
|&emsp;&emsp;description|店铺简介||false|string||
|&emsp;&emsp;licenseImage|营业执照图片 URL||false|string||
|&emsp;&emsp;status|店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝||false|integer(int32)||
|&emsp;&emsp;rating|店铺综合评分（0~5）||false|number||
|&emsp;&emsp;createTime|创建时间||false|string(date-time)||
|&emsp;&emsp;updateTime|更新时间||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 10. 商品


## 分页查询商品列表


**接口地址**:`/api/products`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>支持按分类、品牌、关键字过滤，支持按销量/价格等排序</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|categoryId|分类 ID|query|false|integer(int64)||
|brandId|品牌 ID|query|false|integer(int64)||
|keyword|搜索关键字|query|false|string||
|sortBy|排序方式：default 默认，sales 销量降序，price_asc 价格升序，price_desc 价格降序|query|false|string||
|page|页码，从 1 开始|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 商品详情


**接口地址**:`/api/products/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回商品基础信息、Sku 列表、店铺信息等</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|商品 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 商品评价列表


**接口地址**:`/api/products/{id}/reviews`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询某商品的用户评价</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|商品 ID|path|true|integer(int64)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 08. 订单


## 确认收货


**接口地址**:`/api/orders/{orderNo}/receive`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>将待收货订单标记为已完成</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 取消订单


**接口地址**:`/api/orders/{orderNo}/cancel`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>取消待付款或待发货的订单</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 分页查询我的订单


**接口地址**:`/api/orders`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询当前用户的订单，可按状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status|订单状态：0 待付款，1 待发货，2 待收货，3 已完成，4 已取消，5 已退款|query|false|integer(int32)||
|page|页码，从 1 开始|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 购物车结算下单


**接口地址**:`/api/orders`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>从购物车中选择条目结算生成订单，可使用优惠券</p>



**请求示例**:


```javascript
{
  "cartIds": [
    1,
    2
  ],
  "addressId": 1,
  "couponId": 5,
  "remark": "请尽快发货"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|createOrderDTO|购物车结算创建订单请求参数|body|true|CreateOrderDTO|CreateOrderDTO|
|&emsp;&emsp;cartIds|要结算的购物车条目 ID 列表||true|array|integer(int64)|
|&emsp;&emsp;addressId|收货地址 ID||true|integer(int64)||
|&emsp;&emsp;couponId|使用的用户优惠券 ID（可选，不使用不传）||false|integer(int64)||
|&emsp;&emsp;remark|订单备注（可选）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 发表评价


**接口地址**:`/api/orders/review`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>对已完成的订单明细进行评价</p>



**请求示例**:


```javascript
{
  "orderItemId": 1,
  "rating": 5,
  "content": "手机很棒，物流也快！",
  "images": "",
  "isAnonymous": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|reviewDTO|发表商品评价请求参数|body|true|ReviewDTO|ReviewDTO|
|&emsp;&emsp;orderItemId|要评价的订单明细 ID||true|integer(int64)||
|&emsp;&emsp;rating|评分：1~5 星||true|integer(int32)||
|&emsp;&emsp;content|评价内容||false|string||
|&emsp;&emsp;images|评价图片，逗号分隔的 URL 字符串||false|string||
|&emsp;&emsp;isAnonymous|是否匿名：0 公开，1 匿名||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 立即购买下单


**接口地址**:`/api/orders/buy-now`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>从商品详情页直接购买（不走购物车）</p>



**请求示例**:


```javascript
{
  "skuId": 10,
  "quantity": 1,
  "addressId": 1,
  "remark": "请尽快发货"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|buyNowDTO|立即购买（不走购物车）请求参数|body|true|BuyNowDTO|BuyNowDTO|
|&emsp;&emsp;skuId|SKU ID||true|integer(int64)||
|&emsp;&emsp;quantity|购买数量||true|integer(int32)||
|&emsp;&emsp;addressId|收货地址 ID||true|integer(int64)||
|&emsp;&emsp;remark|订单备注（可选）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 订单详情


**接口地址**:`/api/orders/{orderNo}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>根据订单号查询订单详细信息以及明细</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 删除订单


**接口地址**:`/api/orders/{orderNo}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>逻辑删除订单（仅自己可见的订单）</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 14. 管理员-商品


## 审核商品


**接口地址**:`/api/admin/products/{id}/audit`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>修改商品状态：0 下架，1 上架，2 拒绝</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|商品 ID|path|true|integer(int64)||
|status|目标状态：0 下架，1 上架，2 拒绝|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 分页查询商品


**接口地址**:`/api/admin/products`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>管理员查看平台所有商品，可按分类、关键字、状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|categoryId|分类 ID|query|false|integer(int64)||
|keyword|商品名称关键字|query|false|string||
|status|商品状态：0 下架，1 上架，2 待审核|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 15. 管理员-店铺


## 审核店铺


**接口地址**:`/api/admin/shops/{id}/audit`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>修改店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|店铺 ID|path|true|integer(int64)||
|status|目标状态：0 待审核，1 营业中，2 禁用，3 拒绝|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 分页查询店铺


**接口地址**:`/api/admin/shops`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>管理员查看平台所有店铺，支持关键字和状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword|店铺名称关键字|query|false|string||
|status|店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 11. 用户中心


## 获取我的资料


**接口地址**:`/api/user/info`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前登录用户的个人资料（不包含密码）</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 修改我的资料


**接口地址**:`/api/user/info`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>只更新请求体中非空字段；用户 ID 以后台会话为准</p>



**请求示例**:


```javascript
{
  "id": 1,
  "username": "zhangsan",
  "nickname": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "avatar": "",
  "gender": 1,
  "birthday": "2000-01-01",
  "status": 1,
  "role": 0,
  "lastLoginTime": "",
  "lastLoginIp": "127.0.0.1",
  "createTime": "",
  "updateTime": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|user|用户实体|body|true|User|User|
|&emsp;&emsp;id|用户 ID||false|integer(int64)||
|&emsp;&emsp;username|用户名（登录用）||false|string||
|&emsp;&emsp;nickname|昵称||false|string||
|&emsp;&emsp;phone|手机号||false|string||
|&emsp;&emsp;email|邮箱||false|string||
|&emsp;&emsp;avatar|头像 URL||false|string||
|&emsp;&emsp;gender|性别：0 未知，1 男，2 女||false|integer(int32)||
|&emsp;&emsp;birthday|生日||false|string(date)||
|&emsp;&emsp;status|状态：0 禁用，1 正常||false|integer(int32)||
|&emsp;&emsp;role|角色：0 普通用户，1 商家，2 管理员||false|integer(int32)||
|&emsp;&emsp;lastLoginTime|最近登录时间||false|string(date-time)||
|&emsp;&emsp;lastLoginIp|最近登录 IP||false|string||
|&emsp;&emsp;createTime|创建时间||false|string(date-time)||
|&emsp;&emsp;updateTime|更新时间||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 退出登录


**接口地址**:`/api/user/logout`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>注销当前 token</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 02. 收货地址


## 新增收货地址


**接口地址**:`/api/address`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>如果 isDefault=1，则将该地址设为默认</p>



**请求示例**:


```javascript
{
  "id": 1,
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detailAddress": "科技园路 1 号 2 栋 3 楼",
  "isDefault": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|addressDTO|新增/修改收货地址请求参数|body|true|AddressDTO|AddressDTO|
|&emsp;&emsp;id|地址 ID，新增时不传，修改时必传||false|integer(int64)||
|&emsp;&emsp;receiverName|收货人姓名||true|string||
|&emsp;&emsp;receiverPhone|收货人手机号||true|string||
|&emsp;&emsp;province|省份||true|string||
|&emsp;&emsp;city|城市||true|string||
|&emsp;&emsp;district|区/县||true|string||
|&emsp;&emsp;detailAddress|详细地址（街道、门牌号）||true|string||
|&emsp;&emsp;isDefault|是否设为默认地址：0 否，1 是||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 修改收货地址


**接口地址**:`/api/address`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>只能修改当前用户自己的地址，需传入地址 ID</p>



**请求示例**:


```javascript
{
  "id": 1,
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detailAddress": "科技园路 1 号 2 栋 3 楼",
  "isDefault": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|addressDTO|新增/修改收货地址请求参数|body|true|AddressDTO|AddressDTO|
|&emsp;&emsp;id|地址 ID，新增时不传，修改时必传||false|integer(int64)||
|&emsp;&emsp;receiverName|收货人姓名||true|string||
|&emsp;&emsp;receiverPhone|收货人手机号||true|string||
|&emsp;&emsp;province|省份||true|string||
|&emsp;&emsp;city|城市||true|string||
|&emsp;&emsp;district|区/县||true|string||
|&emsp;&emsp;detailAddress|详细地址（街道、门牌号）||true|string||
|&emsp;&emsp;isDefault|是否设为默认地址：0 否，1 是||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 设为默认地址


**接口地址**:`/api/address/default/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>将该地址设为当前用户的默认收货地址</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|地址 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询单个地址详情


**接口地址**:`/api/address/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>只能查询当前用户自己的地址</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|地址 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 删除收货地址


**接口地址**:`/api/address/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>只能删除当前用户自己的地址</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|地址 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询我的收货地址列表


**接口地址**:`/api/address/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前登录用户的所有收货地址</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 16. 管理员-用户


## 启停用户


**接口地址**:`/api/admin/users/{id}/status`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>启用或禁用用户账号</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|用户 ID|path|true|integer(int64)||
|status|目标状态：0 禁用，1 启用|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 分页查询用户


**接口地址**:`/api/admin/users`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>管理员分页查询用户，可按用户名关键字、角色、状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword|用户名关键字|query|false|string||
|role|角色：0 普通用户，1 商家，2 管理员|query|false|integer(int32)||
|status|状态：0 禁用，1 正常|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 05. 商品分类


## 查询分类树


**接口地址**:`/api/categories/tree`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>一次性返回所有启用的商品分类（树形结构）</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询子分类


**接口地址**:`/api/categories/children`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>根据父分类 ID 查询其直接子分类</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|parentId|父分类 ID，0 表示查询一级分类|query|false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 03. 品牌


## 查询所有启用品牌


**接口地址**:`/api/brands`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回状态为启用的所有品牌列表，按排序值升序</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询品牌详情


**接口地址**:`/api/brands/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>根据品牌 ID 查询单个品牌</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|品牌 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 09. 支付


## 创建支付单


**接口地址**:`/api/pay/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>为指定订单创建支付单（mock 模式直接返回支付单号）</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|query|true|string||
|payType|支付方式：1 微信，2 支付宝，3 余额|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 确认支付（mock）


**接口地址**:`/api/pay/confirm`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>将支付单状态置为已支付，仅在 mock 模式下使用</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|paymentNo|支付单号|query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询订单的支付状态


**接口地址**:`/api/pay/status`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>根据订单号查询该订单最近一次支付的状态</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderNo|订单号|query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 13. 管理员-订单


## 分页查询全部订单


**接口地址**:`/api/admin/orders`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>管理员查看平台所有订单，支持关键字和状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword|订单号/收货人关键字|query|false|string||
|status|订单状态|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 17. 商家-订单


## 订单发货


**接口地址**:`/api/merchant/orders/deliver`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>为待发货订单填写物流单号和物流公司完成发货</p>



**请求示例**:


```javascript
{
  "orderNo": "202606300001",
  "logisticsNo": "SF1234567890",
  "logisticsCompany": "顺丰快递"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|deliverDTO|商家发货请求参数|body|true|DeliverDTO|DeliverDTO|
|&emsp;&emsp;orderNo|要发货的订单号||true|string||
|&emsp;&emsp;logisticsNo|物流单号||true|string||
|&emsp;&emsp;logisticsCompany|物流公司名称||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 查询本店订单


**接口地址**:`/api/merchant/orders`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询当前商家名下店铺的订单，可按状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status|订单状态|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 18. 商家-商品


## 查询本店商品


**接口地址**:`/api/merchant/products`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询当前商家店铺下的商品，可按关键字和状态过滤</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword|商品名称关键字|query|false|string||
|status|商品状态：0 下架，1 上架，2 待审核|query|false|integer(int32)||
|page|页码|query|false|integer(int32)||
|size|每页大小|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 新增商品


**接口地址**:`/api/merchant/products`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>提交商品基础信息和 SKU 列表，创建后状态为待审核</p>



**请求示例**:


```javascript
{
  "id": 1,
  "categoryId": 10,
  "brandId": 5,
  "name": "华为 Mate 70 Pro",
  "subtitle": "",
  "mainImage": "",
  "images": [],
  "detail": "",
  "status": 1,
  "skuList": [
    {
      "id": 10,
      "skuName": "12+256 曜石黑",
      "specValues": "{\"颜色\":\"曜石黑\",\"内存\":\"12+256\"}",
      "price": 6999,
      "marketPrice": 7999,
      "stock": 100,
      "image": ""
    }
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|productDTO|商家发布/修改商品请求参数|body|true|ProductDTO|ProductDTO|
|&emsp;&emsp;id|商品 ID，新增时不传，修改时必传||false|integer(int64)||
|&emsp;&emsp;categoryId|分类 ID||false|integer(int64)||
|&emsp;&emsp;brandId|品牌 ID||false|integer(int64)||
|&emsp;&emsp;name|商品名称||false|string||
|&emsp;&emsp;subtitle|商品副标题/宣传语||false|string||
|&emsp;&emsp;mainImage|主图 URL||false|string||
|&emsp;&emsp;images|商品图片 URL 列表||false|array|string|
|&emsp;&emsp;detail|商品详情（富文本 HTML）||false|string||
|&emsp;&emsp;status|状态：0 下架，1 上架，2 待审核||false|integer(int32)||
|&emsp;&emsp;skuList|商品 SKU 信息（随商品一起提交）||false|array|SkuDTO|
|&emsp;&emsp;&emsp;&emsp;id|SKU ID，新增时不传，修改时必传||false|integer||
|&emsp;&emsp;&emsp;&emsp;skuName|SKU 名称||false|string||
|&emsp;&emsp;&emsp;&emsp;specValues|规格值，JSON 字符串||false|string||
|&emsp;&emsp;&emsp;&emsp;price|销售价（元）||false|number||
|&emsp;&emsp;&emsp;&emsp;marketPrice|市场价/划线价（元）||false|number||
|&emsp;&emsp;&emsp;&emsp;stock|初始库存||false|integer||
|&emsp;&emsp;&emsp;&emsp;image|SKU 图片 URL||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 修改商品


**接口地址**:`/api/merchant/products`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>修改商品信息，需传入商品 ID</p>



**请求示例**:


```javascript
{
  "id": 1,
  "categoryId": 10,
  "brandId": 5,
  "name": "华为 Mate 70 Pro",
  "subtitle": "",
  "mainImage": "",
  "images": [],
  "detail": "",
  "status": 1,
  "skuList": [
    {
      "id": 10,
      "skuName": "12+256 曜石黑",
      "specValues": "{\"颜色\":\"曜石黑\",\"内存\":\"12+256\"}",
      "price": 6999,
      "marketPrice": 7999,
      "stock": 100,
      "image": ""
    }
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|productDTO|商家发布/修改商品请求参数|body|true|ProductDTO|ProductDTO|
|&emsp;&emsp;id|商品 ID，新增时不传，修改时必传||false|integer(int64)||
|&emsp;&emsp;categoryId|分类 ID||false|integer(int64)||
|&emsp;&emsp;brandId|品牌 ID||false|integer(int64)||
|&emsp;&emsp;name|商品名称||false|string||
|&emsp;&emsp;subtitle|商品副标题/宣传语||false|string||
|&emsp;&emsp;mainImage|主图 URL||false|string||
|&emsp;&emsp;images|商品图片 URL 列表||false|array|string|
|&emsp;&emsp;detail|商品详情（富文本 HTML）||false|string||
|&emsp;&emsp;status|状态：0 下架，1 上架，2 待审核||false|integer(int32)||
|&emsp;&emsp;skuList|商品 SKU 信息（随商品一起提交）||false|array|SkuDTO|
|&emsp;&emsp;&emsp;&emsp;id|SKU ID，新增时不传，修改时必传||false|integer||
|&emsp;&emsp;&emsp;&emsp;skuName|SKU 名称||false|string||
|&emsp;&emsp;&emsp;&emsp;specValues|规格值，JSON 字符串||false|string||
|&emsp;&emsp;&emsp;&emsp;price|销售价（元）||false|number||
|&emsp;&emsp;&emsp;&emsp;marketPrice|市场价/划线价（元）||false|number||
|&emsp;&emsp;&emsp;&emsp;stock|初始库存||false|integer||
|&emsp;&emsp;&emsp;&emsp;image|SKU 图片 URL||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 上下架商品


**接口地址**:`/api/merchant/products/{id}/status`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>将本店商品切换为上架或下架</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|商品 ID|path|true|integer(int64)||
|status|目标状态：0 下架，1 上架|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 06. 优惠券


## 领取优惠券


**接口地址**:`/api/coupons/claim/{templateId}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>用户从优惠券模板领取一张券到自己的账户</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|templateId|优惠券模板 ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 我的优惠券


**接口地址**:`/api/coupons/mine`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>查询当前登录用户已领取的优惠券；不传 status 返回全部，可按状态过滤：0 未使用 1 已使用 2 已过期</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status|状态：0 未使用，1 已使用，2 已过期|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 可领取的优惠券列表


**接口地址**:`/api/coupons/available`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>查询当前店铺下（不传则查询平台券）当前可领取的优惠券模板</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|shopId|店铺 ID，不传则查询平台券|query|false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


# 01. 账号认证


## 发送短信验证码


**接口地址**:`/api/auth/send-code`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>向指定手机号发送注册/登录用的短信验证码，开发模式下可在响应或 mock 接口中查看验证码</p>



**请求示例**:


```javascript
{
  "phone": "13800138000"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|sendCodeDTO|发送短信验证码请求参数|body|true|SendCodeDTO|SendCodeDTO|
|&emsp;&emsp;phone|接收验证码的手机号||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 用户注册


**接口地址**:`/api/auth/register`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>通过用户名、密码、手机号和短信验证码注册新账号</p>



**请求示例**:


```javascript
{
  "username": "zhangsan",
  "password": "123456",
  "phone": "13800138000",
  "code": "888888",
  "nickname": "张三",
  "email": "zhangsan@example.com"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|registerDTO|注册请求参数|body|true|RegisterDTO|RegisterDTO|
|&emsp;&emsp;username|用户名（唯一）||true|string||
|&emsp;&emsp;password|明文密码||true|string||
|&emsp;&emsp;phone|手机号||true|string||
|&emsp;&emsp;code|短信验证码||true|string||
|&emsp;&emsp;nickname|昵称（可选，默认与用户名一致）||false|string||
|&emsp;&emsp;email|邮箱（可选）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 用户名密码登录


**接口地址**:`/api/auth/login`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>使用用户名和密码登录，成功后返回 token（写入请求头 Authorization）以及用户基本信息</p>



**请求示例**:


```javascript
{
  "username": "zhangsan",
  "password": "123456"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|loginDTO|登录请求参数|body|true|LoginDTO|LoginDTO|
|&emsp;&emsp;username|用户名||true|string||
|&emsp;&emsp;password|明文密码（前端传输时建议 HTTPS）||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```


## 获取短信验证码（仅 Mock）


**接口地址**:`/api/auth/mock-code`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>开发环境下用于查询已发送的短信验证码，方便联调，部署到生产前应移除</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|phone|手机号|query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码：1 成功，-1 失败，其他为业务自定义错误码|integer(int32)|integer(int32)|
|msg|提示信息|string||
|data|业务数据，结构由具体接口决定|object||


**响应示例**:
```javascript
{
	"code": 1,
	"msg": "success",
	"data": {}
}
```