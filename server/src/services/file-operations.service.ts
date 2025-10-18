import axios, { AxiosInstance } from 'axios';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';
import FormData from 'form-data';

export interface FileProvider {
  type: 'google_drive' | 'dropbox' | 'onedrive' | 'aws_s3';
  credentials: any;
  config?: any;
}

export interface FileOperation {
  operation: 'upload' | 'download' | 'delete' | 'list' | 'move' | 'copy' | 'share';
  provider: FileProvider;
  path?: string;
  fileName?: string;
  fileContent?: Buffer | string;
  mimeType?: string;
  folderId?: string;
  destinationPath?: string;
  shareSettings?: {
    permissions: 'read' | 'write' | 'owner';
    type: 'user' | 'group' | 'domain' | 'anyone';
    emailAddress?: string;
  };
}

export interface FileOperationResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  downloadUrl?: string;
  size?: number;
  mimeType?: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    modifiedTime: string;
    webViewLink?: string;
  }>;
  error?: string;
}

export class FileOperationsService {
  private googleDriveClient?: drive_v3.Drive;
  private dropboxClient?: AxiosInstance;
  private oneDriveClient?: AxiosInstance;

  /**
   * Execute file operation based on provider and operation type
   */
  async executeFileOperation(operation: FileOperation): Promise<FileOperationResult> {
    try {
      switch (operation.provider.type) {
        case 'google_drive':
          return await this.executeGoogleDriveOperation(operation);
        case 'dropbox':
          return await this.executeDropboxOperation(operation);
        case 'onedrive':
          return await this.executeOneDriveOperation(operation);
        case 'aws_s3':
          return await this.executeS3Operation(operation);
        default:
          throw new Error(`Unsupported file provider: ${operation.provider.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Google Drive Operations
   */
  private async executeGoogleDriveOperation(operation: FileOperation): Promise<FileOperationResult> {
    const drive = await this.getGoogleDriveClient(operation.provider.credentials);

    switch (operation.operation) {
      case 'upload':
        return await this.uploadToGoogleDrive(drive, operation);
      case 'download':
        return await this.downloadFromGoogleDrive(drive, operation);
      case 'list':
        return await this.listGoogleDriveFiles(drive, operation);
      case 'delete':
        return await this.deleteFromGoogleDrive(drive, operation);
      case 'share':
        return await this.shareGoogleDriveFile(drive, operation);
      default:
        throw new Error(`Operation ${operation.operation} not supported for Google Drive`);
    }
  }

  private async getGoogleDriveClient(credentials: any): Promise<drive_v3.Drive> {
    if (this.googleDriveClient) return this.googleDriveClient;

    const { clientId, clientSecret, refreshToken } = credentials;
    const oauth2Client = new OAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.googleDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return this.googleDriveClient;
  }

  private async uploadToGoogleDrive(drive: drive_v3.Drive, operation: FileOperation): Promise<FileOperationResult> {
    const { fileName, fileContent, mimeType, folderId } = operation;
    
    if (!fileName || !fileContent) {
      throw new Error('fileName and fileContent are required for upload');
    }

    const media = {
      mimeType: mimeType || 'application/octet-stream',
      body: typeof fileContent === 'string' ? Readable.from([fileContent]) : Readable.from([fileContent])
    };

    const requestBody: any = {
      name: fileName,
      parents: folderId ? [folderId] : undefined
    };

    const response = await drive.files.create({
      requestBody,
      media,
      fields: 'id,name,size,mimeType,webViewLink'
    });

    return {
      success: true,
      fileId: response.data.id!,
      fileName: response.data.name!,
      fileUrl: response.data.webViewLink!,
      size: parseInt(response.data.size || '0'),
      mimeType: response.data.mimeType!
    };
  }

  private async downloadFromGoogleDrive(drive: drive_v3.Drive, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.fileName && !operation.folderId) {
      throw new Error('fileName or fileId is required for download');
    }

    // If fileName provided, search for file first
    let fileId = operation.folderId;
    if (!fileId && operation.fileName) {
      const searchResult = await drive.files.list({
        q: `name='${operation.fileName}'`,
        fields: 'files(id,name)'
      });
      
      if (!searchResult.data.files?.length) {
        throw new Error(`File ${operation.fileName} not found`);
      }
      fileId = searchResult.data.files[0].id!;
    }

    const response = await drive.files.get({
      fileId: fileId!,
      alt: 'media'
    }, { responseType: 'stream' });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.data.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          success: true,
          fileId: fileId!,
          fileName: operation.fileName!,
          size: buffer.length,
          downloadUrl: `data:application/octet-stream;base64,${buffer.toString('base64')}`
        });
      });
      response.data.on('error', reject);
    });
  }

  private async listGoogleDriveFiles(drive: drive_v3.Drive, operation: FileOperation): Promise<FileOperationResult> {
    const query = operation.folderId ? `'${operation.folderId}' in parents` : undefined;
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id,name,size,mimeType,modifiedTime,webViewLink)',
      pageSize: 100
    });

    const files = response.data.files?.map(file => ({
      id: file.id!,
      name: file.name!,
      size: parseInt(file.size || '0'),
      mimeType: file.mimeType!,
      modifiedTime: file.modifiedTime!,
      webViewLink: file.webViewLink || undefined
    })) || [];

    return {
      success: true,
      files
    };
  }

  private async deleteFromGoogleDrive(drive: drive_v3.Drive, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.folderId) {
      throw new Error('fileId is required for delete operation');
    }

    await drive.files.delete({ fileId: operation.folderId });

    return {
      success: true,
      fileId: operation.folderId
    };
  }

  private async shareGoogleDriveFile(drive: drive_v3.Drive, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.folderId || !operation.shareSettings) {
      throw new Error('fileId and shareSettings are required for share operation');
    }

    const permission = {
      role: operation.shareSettings.permissions === 'read' ? 'reader' : 
            operation.shareSettings.permissions === 'write' ? 'writer' : 'owner',
      type: operation.shareSettings.type,
      emailAddress: operation.shareSettings.emailAddress
    };

    await drive.permissions.create({
      fileId: operation.folderId,
      requestBody: permission
    });

    return {
      success: true,
      fileId: operation.folderId
    };
  }

  /**
   * Dropbox Operations
   */
  private async executeDropboxOperation(operation: FileOperation): Promise<FileOperationResult> {
    const client = this.getDropboxClient(operation.provider.credentials.accessToken);

    switch (operation.operation) {
      case 'upload':
        return await this.uploadToDropbox(client, operation);
      case 'download':
        return await this.downloadFromDropbox(client, operation);
      case 'list':
        return await this.listDropboxFiles(client, operation);
      case 'delete':
        return await this.deleteFromDropbox(client, operation);
      default:
        throw new Error(`Operation ${operation.operation} not supported for Dropbox`);
    }
  }

  private getDropboxClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.dropboxapi.com/2',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async uploadToDropbox(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    const { fileName, fileContent, path = '' } = operation;
    
    if (!fileName || !fileContent) {
      throw new Error('fileName and fileContent are required for upload');
    }

    const dropboxPath = `${path}/${fileName}`.replace('//', '/');

    const response = await client.post('/files/upload', fileContent, {
      headers: {
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true
        }),
        'Content-Type': 'application/octet-stream'
      }
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      size: response.data.size
    };
  }

  private async downloadFromDropbox(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.path) {
      throw new Error('path is required for Dropbox download');
    }

    const response = await client.post('/files/download', {}, {
      headers: {
        'Dropbox-API-Arg': JSON.stringify({ path: operation.path })
      },
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);
    
    return {
      success: true,
      fileName: operation.fileName || operation.path.split('/').pop()!,
      size: buffer.length,
      downloadUrl: `data:application/octet-stream;base64,${buffer.toString('base64')}`
    };
  }

  private async listDropboxFiles(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    const response = await client.post('/files/list_folder', {
      path: operation.path || '',
      recursive: false
    });

    const files = response.data.entries
      .filter((entry: any) => entry['.tag'] === 'file')
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: 'application/octet-stream',
        modifiedTime: file.server_modified
      }));

    return {
      success: true,
      files
    };
  }

  private async deleteFromDropbox(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.path) {
      throw new Error('path is required for Dropbox delete');
    }

    await client.post('/files/delete_v2', {
      path: operation.path
    });

    return {
      success: true,
      fileName: operation.path.split('/').pop()!
    };
  }

  /**
   * OneDrive Operations (Microsoft Graph API)
   */
  private async executeOneDriveOperation(operation: FileOperation): Promise<FileOperationResult> {
    const client = this.getOneDriveClient(operation.provider.credentials.accessToken);

    switch (operation.operation) {
      case 'upload':
        return await this.uploadToOneDrive(client, operation);
      case 'download':
        return await this.downloadFromOneDrive(client, operation);
      case 'list':
        return await this.listOneDriveFiles(client, operation);
      case 'delete':
        return await this.deleteFromOneDrive(client, operation);
      default:
        throw new Error(`Operation ${operation.operation} not supported for OneDrive`);
    }
  }

  private getOneDriveClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0/me/drive',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async uploadToOneDrive(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    const { fileName, fileContent, path = '' } = operation;
    
    if (!fileName || !fileContent) {
      throw new Error('fileName and fileContent are required for upload');
    }

    const uploadPath = `${path}/${fileName}`.replace('//', '/');

    const response = await client.put(`/root:${uploadPath}:/content`, fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      fileUrl: response.data.webUrl,
      size: response.data.size
    };
  }

  private async downloadFromOneDrive(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.path) {
      throw new Error('path is required for OneDrive download');
    }

    const response = await client.get(`/root:${operation.path}:/content`, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);
    
    return {
      success: true,
      fileName: operation.fileName || operation.path.split('/').pop()!,
      size: buffer.length,
      downloadUrl: `data:application/octet-stream;base64,${buffer.toString('base64')}`
    };
  }

  private async listOneDriveFiles(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    const endpoint = operation.path ? `/root:${operation.path}:/children` : '/root/children';
    const response = await client.get(endpoint);

    const files = response.data.value
      .filter((item: any) => item.file) // Only files, not folders
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.file.mimeType,
        modifiedTime: file.lastModifiedDateTime
      }));

    return {
      success: true,
      files
    };
  }

  private async deleteFromOneDrive(client: AxiosInstance, operation: FileOperation): Promise<FileOperationResult> {
    if (!operation.path) {
      throw new Error('path is required for OneDrive delete');
    }

    await client.delete(`/root:${operation.path}`);

    return {
      success: true,
      fileName: operation.path.split('/').pop()!
    };
  }

  /**
   * AWS S3 Operations (Basic implementation)
   */
  private async executeS3Operation(operation: FileOperation): Promise<FileOperationResult> {
    // This would require AWS SDK implementation
    // For now, return a placeholder
    return {
      success: false,
      error: 'AWS S3 operations not yet implemented. Use HTTP API for S3 REST API calls.'
    };
  }

  /**
   * Helper method to detect file provider from URL or path
   */
  static detectProvider(urlOrPath: string): 'google_drive' | 'dropbox' | 'onedrive' | 'unknown' {
    if (urlOrPath.includes('drive.google.com')) return 'google_drive';
    if (urlOrPath.includes('dropbox.com')) return 'dropbox';
    if (urlOrPath.includes('onedrive.live.com') || urlOrPath.includes('sharepoint.com')) return 'onedrive';
    return 'unknown';
  }

  /**
   * Get supported file operations for each provider
   */
  static getSupportedOperations() {
    return {
      google_drive: ['upload', 'download', 'list', 'delete', 'share', 'move', 'copy'],
      dropbox: ['upload', 'download', 'list', 'delete', 'move'],
      onedrive: ['upload', 'download', 'list', 'delete', 'move'],
      aws_s3: ['upload', 'download', 'list', 'delete'] // When implemented
    };
  }
}