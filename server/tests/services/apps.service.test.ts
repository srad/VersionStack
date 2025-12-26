import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppsService } from '../../src/services/apps.service';
import { AppsRepository } from '../../src/repositories/apps.repository';
import { VersionsRepository } from '../../src/repositories/versions.repository';
import { FileStorage } from '../../src/storage/file-storage';
import { AppNotFoundError, AlreadyExistsError } from '../../src/errors';
import { App } from '../../src/types';

// Mock the audit utility
vi.mock('../../src/utils/audit', () => ({
  auditLog: {
    appCreate: vi.fn(),
    appUpdate: vi.fn(),
    appDelete: vi.fn(),
  },
}));

describe('AppsService', () => {
  let service: AppsService;
  let mockAppsRepo: Partial<AppsRepository>;
  let mockVersionsRepo: Partial<VersionsRepository>;
  let mockFileStorage: Partial<FileStorage>;

  const mockApp: App = {
    id: 1,
    app_key: 'test-app',
    display_name: 'Test App',
    current_version_id: null,
    is_public: 0,
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mockAppsRepo = {
      findAll: vi.fn(),
      findByScope: vi.fn(),
      findByKey: vi.fn(),
      exists: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clearCurrentVersion: vi.fn(),
      withTransaction: vi.fn((fn) => fn()),
    };

    mockVersionsRepo = {
      findByAppId: vi.fn(),
      deleteFilesByAppId: vi.fn(),
      deleteByAppId: vi.fn(),
    };

    mockFileStorage = {
      deleteAppDirectory: vi.fn(),
    };

    service = new AppsService(
      mockAppsRepo as AppsRepository,
      mockVersionsRepo as VersionsRepository,
      mockFileStorage as FileStorage
    );
  });

  describe('listApps', () => {
    it('should return all apps when no scope is provided', async () => {
      vi.mocked(mockAppsRepo.findAll!).mockResolvedValue([mockApp]);

      const result = await service.listApps(null);

      expect(mockAppsRepo.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].appKey).toBe('test-app');
    });

    it('should filter apps by scope when provided', async () => {
      vi.mocked(mockAppsRepo.findByScope!).mockResolvedValue([mockApp]);

      const result = await service.listApps(['test-app']);

      expect(mockAppsRepo.findByScope).toHaveBeenCalledWith(['test-app']);
      expect(result).toHaveLength(1);
    });
  });

  describe('getApp', () => {
    it('should return app when it exists', async () => {
      vi.mocked(mockAppsRepo.findByKey!).mockResolvedValue(mockApp);

      const result = await service.getApp('test-app');

      expect(result.appKey).toBe('test-app');
      expect(result.displayName).toBe('Test App');
    });

    it('should throw AppNotFoundError when app does not exist', async () => {
      vi.mocked(mockAppsRepo.findByKey!).mockResolvedValue(undefined);

      await expect(service.getApp('unknown')).rejects.toMatchObject({
        code: 'APP_NOT_FOUND',
        status: 404,
      });
    });
  });

  describe('createApp', () => {
    it('should create app when key is unique', async () => {
      vi.mocked(mockAppsRepo.exists!).mockResolvedValue(false);
      vi.mocked(mockAppsRepo.create!).mockResolvedValue(1);

      const result = await service.createApp(
        { appKey: 'new-app', displayName: 'New App', isPublic: false },
        {} as any
      );

      expect(result.id).toBe(1);
      expect(result.appKey).toBe('new-app');
    });

    it('should throw AlreadyExistsError when key exists', async () => {
      vi.mocked(mockAppsRepo.exists!).mockResolvedValue(true);

      await expect(
        service.createApp(
          { appKey: 'test-app', displayName: 'Test', isPublic: false },
          {} as any
        )
      ).rejects.toMatchObject({
        code: 'ALREADY_EXISTS',
        status: 409,
      });
    });
  });

  describe('deleteApp', () => {
    it('should delete app and all associated data', async () => {
      vi.mocked(mockAppsRepo.findByKey!).mockResolvedValue(mockApp);
      vi.mocked(mockVersionsRepo.findByAppId!).mockResolvedValue([
        { id: 1, app_id: 1, version_name: '1.0.0', is_active: true, created_at: '' },
      ]);

      const result = await service.deleteApp('test-app', {} as any);

      expect(mockAppsRepo.clearCurrentVersion).toHaveBeenCalledWith(1);
      expect(mockVersionsRepo.deleteFilesByAppId).toHaveBeenCalledWith(1);
      expect(mockVersionsRepo.deleteByAppId).toHaveBeenCalledWith(1);
      expect(mockAppsRepo.delete).toHaveBeenCalledWith(1);
      expect(mockFileStorage.deleteAppDirectory).toHaveBeenCalledWith('test-app');
      expect(result.deleted.versionsCount).toBe(1);
    });

    it('should throw AppNotFoundError when app does not exist', async () => {
      vi.mocked(mockAppsRepo.findByKey!).mockResolvedValue(undefined);

      await expect(service.deleteApp('unknown', {} as any)).rejects.toMatchObject({
        code: 'APP_NOT_FOUND',
        status: 404,
      });
    });
  });
});
