import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createZipAndDownload(
  files: {
    name: string;
    content: string;
  }[],
  zipName: string,
): Promise<void> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.content);
  });

  return new Promise((resolve, reject) => {
    zip
      .generateAsync({ type: 'blob' })
      .then((content) => {
        saveAs(content, zipName);
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// between 10000 and 65535
export function getRandomPort(): number {
  return Math.floor(Math.random() * (65535 - 10000 + 1)) + 10000;
}
