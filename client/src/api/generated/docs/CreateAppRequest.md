# CreateAppRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**appKey** | **string** | Unique identifier (alphanumeric with dashes) | [default to undefined]
**displayName** | **string** | Human-readable name | [optional] [default to undefined]
**isPublic** | **boolean** | Whether the /latest endpoint is publicly accessible (default: false) | [optional] [default to undefined]

## Example

```typescript
import { CreateAppRequest } from './api';

const instance: CreateAppRequest = {
    appKey,
    displayName,
    isPublic,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
