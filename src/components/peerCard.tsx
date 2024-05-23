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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import {
  CheckIcon,
  ClipboardIcon,
  EllipsisVerticalIcon,
  FileDownIcon,
  QrCodeIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { type ChangeEvent, useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from './ui/use-toast';
import { useCopyContent } from '@/hooks/copy';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { WireGuardConfig, generateWgConf } from '@/lib/wg';
import { mihomo, singBox, surge } from '@/lib/transform';

interface PeerCardProps {
  title: string;
  conf: WireGuardConfig;
}

export function PeerCard({ title, conf }: PeerCardProps) {
  const { toast } = useToast();
  const [confText, setConfText] = useState('');
  const { hasCopied, copyContent } = useCopyContent();

  const [transformedText, setTransformedText] = useState('');
  const { hasCopied: tCopied, copyContent: copyTransformedText } =
    useCopyContent();

  useEffect(() => {
    setConfText(generateWgConf(conf));
  }, [conf]);

  const downloadFile = () => {
    try {
      saveAs(
        new Blob([confText], { type: 'text/plain;charset=utf-8' }),
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
    setConfText(e.target.value);
  };

  const transToSurge = () => {
    setTransformedText(surge(confText));
  };
  const transToMihomo = () => {
    setTransformedText(mihomo(confText));
  };
  const transToSingBox = () => {
    setTransformedText(singBox(confText));
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyContent(confText)}
              >
                {hasCopied ? (
                  <CheckIcon size={24} />
                ) : (
                  <ClipboardIcon size={24} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasCopied ? 'Copied!' : 'Copy Config'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={downloadFile}>
                <FileDownIcon size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download File</p>
            </TooltipContent>
          </Tooltip>
          <Dialog>
            <DialogTrigger asChild>
              {/* TODO: use tooltip trigger inside dialog trigger will make error */}
              <Button variant="outline" size="icon">
                <QrCodeIcon size={24} />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-fit p-10">
              <QRCode value={confText} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-6">
                  <EllipsisVerticalIcon size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" sideOffset={10}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={transToSurge}>
                    Surge
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={transToMihomo}>
                    mihomo
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={transToSingBox}>
                    sing-box
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent className="w-full max-w-3xl p-10">
              <Button
                className="absolute right-12 top-12 h-6 w-6"
                variant="outline"
                size="icon"
                onClick={() => copyTransformedText(transformedText)}
              >
                {tCopied ? (
                  <CheckIcon size={16} />
                ) : (
                  <ClipboardIcon size={16} />
                )}
              </Button>
              <Textarea
                rows={transformedText.split('\n').length + 1}
                className="base-input font-mono"
                value={transformedText}
                readOnly
              ></Textarea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={confText.split('\n').length}
          className="base-input font-mono"
          value={confText}
          onChange={handleChange}
        ></Textarea>
      </CardContent>
    </Card>
  );
}
