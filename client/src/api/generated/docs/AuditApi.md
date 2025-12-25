# AuditApi

All URIs are relative to */api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**auditGet**](#auditget) | **GET** /audit | Get audit log|

# **auditGet**
> AuditLogResponse auditGet()

Retrieve audit log entries for security monitoring. Admin only.

### Example

```typescript
import {
    AuditApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuditApi(configuration);

let action: string; //Filter by action type (optional) (default to undefined)
let entityType: string; //Filter by entity type (app, version, api_key, auth) (optional) (default to undefined)
let entityId: string; //Filter by entity ID (optional) (default to undefined)
let limit: string; //Number of entries to return (default: 100) (optional) (default to undefined)
let offset: string; //Offset for pagination (default: 0) (optional) (default to undefined)

const { status, data } = await apiInstance.auditGet(
    action,
    entityType,
    entityId,
    limit,
    offset
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **action** | [**string**] | Filter by action type | (optional) defaults to undefined|
| **entityType** | [**string**] | Filter by entity type (app, version, api_key, auth) | (optional) defaults to undefined|
| **entityId** | [**string**] | Filter by entity ID | (optional) defaults to undefined|
| **limit** | [**string**] | Number of entries to return (default: 100) | (optional) defaults to undefined|
| **offset** | [**string**] | Offset for pagination (default: 0) | (optional) defaults to undefined|


### Return type

**AuditLogResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Audit log entries |  -  |
|**401** | Unauthorized |  -  |
|**403** | Admin permission required |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

