import axios, { AxiosInstance } from 'axios';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';
import FormData from 'form-data';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';

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
    const { credentials } = operation.provider;
    const accessKeyId = credentials?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = credentials?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = credentials?.sessionToken || process.env.AWS_SESSION_TOKEN;
    const region = credentials?.region || process.env.AWS_REGION || 'us-east-1';
    const bucket = credentials?.bucket || process.env.AWS_S3_BUCKET;
    const endpoint = credentials?.endpoint;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('AWS S3 credentials or bucket not configured');
    }

    const baseHost = endpoint || `${bucket}.s3.${region}.amazonaws.com`;
    const baseUrl = endpoint?.startsWith('http') ? endpoint : `https://${baseHost}`;
    const key = operation.path || operation.fileName || '';
    const objectKey = key.replace(/^\/+/, '');

    switch (operation.operation) {
      case 'upload':
        if (!operation.fileContent || !operation.fileName) {
          throw new Error('fileName and fileContent are required for S3 upload');
        }
        return await this.uploadToS3(baseUrl, baseHost, region, bucket, objectKey || operation.fileName, operation, accessKeyId, secretAccessKey, sessionToken);
      case 'download':
        if (!objectKey) {
          throw new Error('path is required for S3 download');
        }
        return await this.downloadFromS3(baseUrl, baseHost, region, bucket, objectKey, accessKeyId, secretAccessKey, sessionToken);
      case 'delete':
        if (!objectKey) {
          throw new Error('path is required for S3 delete');
        }
        return await this.deleteFromS3(baseUrl, baseHost, region, bucket, objectKey, accessKeyId, secretAccessKey, sessionToken);
      case 'list':
        return await this.listS3Objects(baseUrl, baseHost, region, bucket, objectKey, accessKeyId, secretAccessKey, sessionToken);
      default:
        throw new Error(`Operation ${operation.operation} not supported for S3`);
    }
  }

  private async uploadToS3(
    baseUrl: string,
    host: string,
    region: string,
    bucket: string,
    key: string,
    operation: FileOperation,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
  ): Promise<FileOperationResult> {
    const url = `${baseUrl}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
    const body = typeof operation.fileContent === 'string'
      ? Buffer.from(operation.fileContent)
      : operation.fileContent;

    const headers: Record<string, string> = {
      host,
      'content-type': operation.mimeType || 'application/octet-stream',
      'content-length': String(body?.length || 0)
    };

    const signed = this.signAwsRequest('PUT', `/${key}`, '', headers, body || Buffer.from(''), region, bucket, accessKeyId, secretAccessKey, sessionToken);

    await axios.put(url, body, { headers: signed });

    return {
      success: true,
      fileName: key,
      fileUrl: url
    };
  }

  private async downloadFromS3(
    baseUrl: string,
    host: string,
    region: string,
    bucket: string,
    key: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
  ): Promise<FileOperationResult> {
    const url = `${baseUrl}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
    const headers: Record<string, string> = { host };
    const signed = this.signAwsRequest('GET', `/${key}`, '', headers, '', region, bucket, accessKeyId, secretAccessKey, sessionToken);

    const response = await axios.get(url, { headers: signed, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    return {
      success: true,
      fileName: key,
      size: buffer.length,
      downloadUrl: `data:application/octet-stream;base64,${buffer.toString('base64')}`
    };
  }

  private async deleteFromS3(
    baseUrl: string,
    host: string,
    region: string,
    bucket: string,
    key: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
  ): Promise<FileOperationResult> {
    const url = `${baseUrl}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
    const headers: Record<string, string> = { host };
    const signed = this.signAwsRequest('DELETE', `/${key}`, '', headers, '', region, bucket, accessKeyId, secretAccessKey, sessionToken);

    await axios.delete(url, { headers: signed });

    return {
      success: true,
      fileName: key
    };
  }

  private async listS3Objects(
    baseUrl: string,
    host: string,
    region: string,
    bucket: string,
    prefix: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
  ): Promise<FileOperationResult> {
    const query = `list-type=2${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
    const url = `${baseUrl}/?${query}`;
    const headers: Record<string, string> = { host };
    const signed = this.signAwsRequest('GET', '/', query, headers, '', region, bucket, accessKeyId, secretAccessKey, sessionToken);

    const response = await axios.get(url, { headers: signed });
    const xml = response.data as string;
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const contents = parsed?.ListBucketResult?.Contents;
    const items = Array.isArray(contents) ? contents : contents ? [contents] : [];

    const files = items.map(item => ({
      id: item.Key || '',
      name: item.Key || '',
      size: item.Size ? Number(item.Size) : 0,
      mimeType: 'application/octet-stream',
      modifiedTime: item.LastModified || '',
      webViewLink: `${baseUrl}/${item.Key || ''}`
    }));

    return {
      success: true,
      files
    };
  }

  private signAwsRequest(
    method: string,
    path: string,
    query: string,
    headers: Record<string, string>,
    body: Buffer | string,
    region: string,
    bucket: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
  ): Record<string, string> {
    const service = 's3';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');
    const canonicalHeaders = Object.entries({
      ...headers,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {})
    })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key.toLowerCase()}:${String(value).trim()}\n`)
      .join('');

    const signedHeaders = Object.keys({
      ...headers,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {})
    })
      .map(key => key.toLowerCase())
      .sort()
      .join(';');

    const canonicalRequest = [
      method,
      path,
      query,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const signingKey = this.getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      ...(sessionToken ? { 'x-amz-security-token': sessionToken } : {}),
      Authorization: authorizationHeader
    };
  }

  private getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
    const kDate = crypto.createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    return crypto.createHmac('sha256', kService).update('aws4_request').digest();
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
      aws_s3: ['upload', 'download', 'list', 'delete']
    };
  }
}
