# ApiKey


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**name** | **string** |  | [default to undefined]
**permission** | **string** |  | [default to undefined]
**appScope** | **Array&lt;string&gt;** | Null for global access, or array of app keys | [default to undefined]
**isActive** | **boolean** |  | [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**lastUsedAt** | **string** |  | [default to undefined]

## Example

```typescript
import { ApiKey } from './api';

const instance: ApiKey = {
    id,
    name,
    permission,
    appScope,
    isActive,
    createdAt,
    lastUsedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
