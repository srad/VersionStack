# CreateApiKeyRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Human-readable name for the key | [default to undefined]
**permission** | **string** | Permission level: read, write, or admin | [default to undefined]
**appScope** | **Array&lt;string&gt;** | Limit key to specific apps (omit for global access) | [optional] [default to undefined]

## Example

```typescript
import { CreateApiKeyRequest } from './api';

const instance: CreateApiKeyRequest = {
    name,
    permission,
    appScope,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
