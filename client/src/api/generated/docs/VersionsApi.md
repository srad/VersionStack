# VersionsApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**appsAppKeyActiveVersionPut**](#appsappkeyactiveversionput) | **PUT** /apps/{appKey}/active-version | Set active version|
|[**appsAppKeyLatestGet**](#appsappkeylatestget) | **GET** /apps/{appKey}/latest | Get latest (active) version|
|[**appsAppKeyVersionsGet**](#appsappkeyversionsget) | **GET** /apps/{appKey}/versions | List all versions|
|[**appsAppKeyVersionsPost**](#appsappkeyversionspost) | **POST** /apps/{appKey}/versions | Upload new version|
|[**appsAppKeyVersionsVersionIdDelete**](#appsappkeyversionsversioniddelete) | **DELETE** /apps/{appKey}/versions/{versionId} | Delete version|

# **appsAppKeyActiveVersionPut**
> MessageResponse appsAppKeyActiveVersionPut()

Set a specific version as the active (current) version for the application.

### Example

```typescript
import {
    VersionsApi,
    Configuration,
    SetActiveVersionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new VersionsApi(configuration);

let appKey: string; //Unique application key (default to undefined)
let setActiveVersionRequest: SetActiveVersionRequest; // (optional)

const { status, data } = await apiInstance.appsAppKeyActiveVersionPut(
    appKey,
    setActiveVersionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setActiveVersionRequest** | **SetActiveVersionRequest**|  | |
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**MessageResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Active version updated successfully |  -  |
|**400** | Validation error |  -  |
|**401** | Unauthorized |  -  |
|**404** | App or version not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyLatestGet**
> LatestVersion appsAppKeyLatestGet()

Public endpoint to get the currently active version for an application. Used by clients/devices to check for updates.

### Example

```typescript
import {
    VersionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VersionsApi(configuration);

let appKey: string; //Unique application key (default to undefined)

const { status, data } = await apiInstance.appsAppKeyLatestGet(
    appKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**LatestVersion**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Latest version information |  -  |
|**404** | App not found or no versions available |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyVersionsGet**
> Array<Version> appsAppKeyVersionsGet()

Retrieve all versions for an application with their files.

### Example

```typescript
import {
    VersionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VersionsApi(configuration);

let appKey: string; //Unique application key (default to undefined)

const { status, data } = await apiInstance.appsAppKeyVersionsGet(
    appKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|


### Return type

**Array<Version>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of versions |  -  |
|**401** | Unauthorized |  -  |
|**404** | App not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyVersionsPost**
> UploadVersionResponse appsAppKeyVersionsPost()

Upload one or more files as a new version. Automatically sets as active version.

### Example

```typescript
import {
    VersionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VersionsApi(configuration);

let appKey: string; //Unique application key (default to undefined)
let files: Array<File>; //Files to upload (default to undefined)
let versionName: string; //Version name (auto-generated if not provided) (optional) (default to undefined)

const { status, data } = await apiInstance.appsAppKeyVersionsPost(
    appKey,
    files,
    versionName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|
| **files** | **Array&lt;File&gt;** | Files to upload | defaults to undefined|
| **versionName** | [**string**] | Version name (auto-generated if not provided) | (optional) defaults to undefined|


### Return type

**UploadVersionResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Version uploaded successfully |  -  |
|**400** | Validation error or no files provided |  -  |
|**401** | Unauthorized |  -  |
|**404** | App not found |  -  |
|**409** | Version already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **appsAppKeyVersionsVersionIdDelete**
> MessageResponse appsAppKeyVersionsVersionIdDelete()

Delete a specific version and its files. Cannot delete the active version.

### Example

```typescript
import {
    VersionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new VersionsApi(configuration);

let appKey: string; //Unique application key (default to undefined)
let versionId: string; //Version ID (default to undefined)

const { status, data } = await apiInstance.appsAppKeyVersionsVersionIdDelete(
    appKey,
    versionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **appKey** | [**string**] | Unique application key | defaults to undefined|
| **versionId** | [**string**] | Version ID | defaults to undefined|


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
|**200** | Version deleted successfully |  -  |
|**400** | Cannot delete active version |  -  |
|**401** | Unauthorized |  -  |
|**404** | App or version not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

