import { injectable } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sanitize } from '../middleware/validate';

export interface FileInfo {
  fileName: string;
  fileHash: string;
  fileSize: number;
  downloadUrl: string;
}

export interface UploadedFile {
  path: string;
  originalname: string;
  size: number;
}

@injectable()
export class FileStorage {
  private readonly basePath: string;
  private readonly tmpPath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'data/files');
    this.tmpPath = path.join(process.cwd(), 'data/tmp_uploads');
  }

  async saveFile(
    appKey: string,
    versionName: string,
    file: UploadedFile
  ): Promise<FileInfo> {
    const sanitizedFileName = sanitize.fileName(file.originalname);
    const targetDir = path.join(this.basePath, appKey, versionName);
    const targetPath = path.join(targetDir, sanitizedFileName);

    await fs.promises.mkdir(targetDir, { recursive: true });

    const hash = await this.calculateHash(file.path);

    await fs.promises.rename(file.path, targetPath);

    return {
      fileName: sanitizedFileName,
      fileHash: hash,
      fileSize: file.size,
      downloadUrl: `/files/${appKey}/${versionName}/${sanitizedFileName}`,
    };
  }

  async deleteFile(appKey: string, versionName: string, fileName: string): Promise<void> {
    const filePath = path.join(this.basePath, appKey, versionName, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async deleteVersionDirectory(appKey: string, versionName: string): Promise<void> {
    const versionDir = path.join(this.basePath, appKey, versionName);
    if (fs.existsSync(versionDir)) {
      const files = await fs.promises.readdir(versionDir);
      if (files.length === 0) {
        await fs.promises.rmdir(versionDir);
      }
    }
  }

  async deleteAppDirectory(appKey: string): Promise<void> {
    const appDir = path.join(this.basePath, appKey);
    if (fs.existsSync(appDir)) {
      await fs.promises.rm(appDir, { recursive: true, force: true });
    }
  }

  cleanupTempFiles(files: UploadedFile[]): void {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  private calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}

export const FILE_STORAGE_TOKEN = 'FileStorage';
