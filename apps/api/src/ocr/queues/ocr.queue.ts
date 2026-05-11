export const OCR_QUEUE_NAME = 'ocr' as const;

export type OcrJobData = {
  documentId: string;
  userId: string;
};
