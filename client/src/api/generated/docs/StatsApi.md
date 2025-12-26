# StatsApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**statsGet**](#statsget) | **GET** /stats | Get dashboard statistics|

# **statsGet**
> Stats statsGet()

Retrieve aggregated statistics for the dashboard including total apps, versions, storage usage, and recent activity.

### Example

```typescript
import {
    StatsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StatsApi(configuration);

const { status, data } = await apiInstance.statsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Stats**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Dashboard statistics |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

