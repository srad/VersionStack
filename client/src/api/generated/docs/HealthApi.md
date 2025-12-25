# HealthApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**healthGet**](#healthget) | **GET** /health | Full health status|
|[**healthLiveGet**](#healthliveget) | **GET** /health/live | Liveness probe|
|[**healthReadyGet**](#healthreadyget) | **GET** /health/ready | Readiness probe|

# **healthGet**
> HealthStatus healthGet()

Get comprehensive health status including database connectivity.

### Example

```typescript
import {
    HealthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HealthApi(configuration);

const { status, data } = await apiInstance.healthGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**HealthStatus**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | System is healthy |  -  |
|**503** | System is unhealthy |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **healthLiveGet**
> Liveness healthLiveGet()

Kubernetes liveness probe - checks if the application is running.

### Example

```typescript
import {
    HealthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HealthApi(configuration);

const { status, data } = await apiInstance.healthLiveGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Liveness**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Application is alive |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **healthReadyGet**
> Readiness healthReadyGet()

Kubernetes readiness probe - checks if the application can serve traffic.

### Example

```typescript
import {
    HealthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HealthApi(configuration);

const { status, data } = await apiInstance.healthReadyGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Readiness**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Application is ready |  -  |
|**503** | Application is not ready |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

