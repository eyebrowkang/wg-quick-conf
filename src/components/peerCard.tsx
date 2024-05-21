import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { EllipsisVerticalIcon, FileDownIcon, QrCodeIcon } from 'lucide-react';
import QRCode from 'react-qr-code';
import { type ChangeEvent, useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from './ui/use-toast';

interface PeerCardProps {
  title: string;
  content: string;
}

export function PeerCard({ title, content }: PeerCardProps) {
  const { toast } = useToast();
  const [value, setValue] = useState(content);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const downloadFile = () => {
    try {
      saveAs(
        new Blob([value], { type: 'text/plain;charset=utf-8' }),
        `${title}.conf`,
      );
    } catch (err) {
      console.error(err);
      toast({
        title: 'Download File Error!',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div>
          <Button variant="outline" size="icon" onClick={downloadFile}>
            <FileDownIcon size={24} />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="ml-2">
                <QrCodeIcon size={24} />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-fit p-10">
              <QRCode value={value} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" className="ml-2 w-6">
            <EllipsisVerticalIcon size={24} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={value.split('\n').length}
          className="base-input font-mono"
          value={value}
          onChange={handleChange}
        ></Textarea>
      </CardContent>
    </Card>
  );
}
