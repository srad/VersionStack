# AuthenticationApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authLoginPost**](#authloginpost) | **POST** /auth/login | Authenticate with API key and get JWT token|

# **authLoginPost**
> LoginResponse authLoginPost()

Authenticate with an API key to receive a JWT token for API access.

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    LoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let loginRequest: LoginRequest; // (optional)

const { status, data } = await apiInstance.authLoginPost(
    loginRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | **LoginRequest**|  | |


### Return type

**LoginResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Authentication successful |  -  |
|**401** | Invalid API key |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

