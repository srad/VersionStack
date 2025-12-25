# AppsApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**appsAppKeyDelete**](#appsappkeydelete) | **DELETE** /apps/{appKey} | Delete application|
|[**appsAppKeyGet**](#appsappkeyget) | **GET** /apps/{appKey} | Get application details|
|[**appsAppKeyPut**](#appsappkeyput) | **PUT** /apps/{appKey} | Update application metadata|
|[**appsGet**](#appsget) | **GET** /apps | List all applications|
|[**appsPost**](#appspost) | **POST** /apps | Create a new application|

# **appsAppKeyDelete**
> DeleteAppResponse appsAppKeyDelete()

Delete an application and all its versions and files.

### Example

```typescript
import {
    AppsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AppsApi(configuration);

let appKey: string; //Unique application key (default to undefined)

const { status, data } = await apiInstance.appsAppKeyDelete(
    appKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**DeleteAppResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Application deleted successfully |  -  |
|**401** | Unauthorized |  -  |
|**404** | App not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyGet**
> App appsAppKeyGet()

Retrieve details of a specific application by its key.

### Example

```typescript
import {
    AppsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AppsApi(configuration);

let appKey: string; //Unique application key (default to undefined)

const { status, data } = await apiInstance.appsAppKeyGet(
    appKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**App**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Application details |  -  |
|**401** | Unauthorized |  -  |
|**404** | App not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyPut**
> App appsAppKeyPut()

Update the display name of an existing application.

### Example

```typescript
import {
    AppsApi,
    Configuration,
    UpdateAppRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AppsApi(configuration);

let appKey: string; //Unique application key (default to undefined)
let updateAppRequest: UpdateAppRequest; // (optional)

const { status, data } = await apiInstance.appsAppKeyPut(
    appKey,
    updateAppRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateAppRequest** | **UpdateAppRequest**|  | |
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**App**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Application updated successfully |  -  |
|**400** | Validation error |  -  |
|**401** | Unauthorized |  -  |
|**404** | App not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsGet**
> Array<App> appsGet()

Retrieve a list of all registered applications.

### Example

```typescript
import {
    AppsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AppsApi(configuration);

const { status, data } = await apiInstance.appsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<App>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of applications |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsPost**
> App appsPost()

Register a new application in the system.

### Example

```typescript
import {
    AppsApi,
    Configuration,
    CreateAppRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AppsApi(configuration);

let createAppRequest: CreateAppRequest; // (optional)

const { status, data } = await apiInstance.appsPost(
    createAppRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createAppRequest** | **CreateAppRequest**|  | |


### Return type

**App**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Application created successfully |  -  |
|**400** | Validation error |  -  |
|**401** | Unauthorized |  -  |
|**409** | Application already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

