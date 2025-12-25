# APIKeysApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authApiKeysGet**](#authapikeysget) | **GET** /auth/api-keys | List all API keys|
|[**authApiKeysKeyIdDelete**](#authapikeyskeyiddelete) | **DELETE** /auth/api-keys/{keyId} | Revoke an API key|
|[**authApiKeysPost**](#authapikeyspost) | **POST** /auth/api-keys | Create a new API key|

# **authApiKeysGet**
> Array<ApiKey> authApiKeysGet()

Retrieve all API keys. Requires admin permission.

### Example

```typescript
import {
    APIKeysApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new APIKeysApi(configuration);

const { status, data } = await apiInstance.authApiKeysGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<ApiKey>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of API keys |  -  |
|**401** | Unauthorized |  -  |
|**403** | Insufficient permissions |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authApiKeysKeyIdDelete**
> MessageResponse authApiKeysKeyIdDelete()

Revoke (soft-delete) an API key. Requires admin permission.

### Example

```typescript
import {
    APIKeysApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new APIKeysApi(configuration);

let keyId: string; //API Key ID (default to undefined)

const { status, data } = await apiInstance.authApiKeysKeyIdDelete(
    keyId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | API Key ID | defaults to undefined|


### Return type

**MessageResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | API key revoked successfully |  -  |
|**401** | Unauthorized |  -  |
|**403** | Insufficient permissions |  -  |
|**404** | API key not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authApiKeysPost**
> CreateApiKeyResponse authApiKeysPost()

Create a new API key with specified permissions. The key is shown only once in the response. Requires admin permission.

### Example

```typescript
import {
    APIKeysApi,
    Configuration,
    CreateApiKeyRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new APIKeysApi(configuration);

let createApiKeyRequest: CreateApiKeyRequest; // (optional)

const { status, data } = await apiInstance.authApiKeysPost(
    createApiKeyRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createApiKeyRequest** | **CreateApiKeyRequest**|  | |


### Return type

**CreateApiKeyResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | API key created successfully |  -  |
|**400** | Validation error |  -  |
|**401** | Unauthorized |  -  |
|**403** | Insufficient permissions |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

