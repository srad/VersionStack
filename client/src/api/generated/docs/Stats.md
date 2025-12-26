# Stats


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**totalApps** | **number** | Total number of registered applications | [default to undefined]
**totalVersions** | **number** | Total number of versions across all applications | [default to undefined]
**totalStorageBytes** | **number** | Total storage used by all files in bytes | [default to undefined]
**appsWithActiveVersion** | **number** | Number of applications that have an active version set | [default to undefined]
**recentUploads** | **number** | Number of version uploads in the last 7 days | [default to undefined]

## Example

```typescript
import { Stats } from './api';

const instance: Stats = {
    totalApps,
    totalVersions,
    totalStorageBytes,
    appsWithActiveVersion,
    recentUploads,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
