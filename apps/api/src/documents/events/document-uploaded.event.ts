export class DocumentUploadedEvent {
  static readonly NAME = 'document.uploaded';
  constructor(public readonly documentId: string) {}
}
