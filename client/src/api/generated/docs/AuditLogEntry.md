# AuditLogEntry


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**action** | **string** | The action that was performed | [default to undefined]
**entityType** | **string** | Type of entity affected (app, version, api_key, auth) | [default to undefined]
**entityId** | **string** | Identifier of the affected entity | [default to undefined]
**actorKeyId** | **number** | ID of the API key that performed the action (null for bootstrap admin) | [default to undefined]
**actorKeyName** | **string** | Name of the API key that performed the action | [default to undefined]
**actorIp** | **string** | IP address of the request | [default to undefined]
**details** | **{ [key: string]: any | null; }** | Additional details about the action | [default to undefined]
**createdAt** | **string** |  | [default to undefined]

## Example

```typescript
import { AuditLogEntry } from './api';

const instance: AuditLogEntry = {
    id,
    action,
    entityType,
    entityId,
    actorKeyId,
    actorKeyName,
    actorIp,
    details,
    createdAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
